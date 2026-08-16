import { NextResponse } from "next/server";
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  datamartAPI,
  DatamartAPIService,
  DatamartPurchaseRequest,
} from '@/lib/datamart-api';
import {
  executePurchaseWithIdempotency,
  createLogicalPurchaseId,
  type PurchaseAttemptStore,
  type LogicalPurchaseParams,
} from '@/lib/datamart-idempotency';
import { safeDatamartMessage, httpStatusForDatamartError, DatamartError } from '@/lib/datamart-errors';
import { Timestamp } from "firebase-admin/firestore";
import { sendSms } from '@/lib/sms';
import { SMS_TEMPLATES, processSmsTemplate } from '@/config/sms';
import { normalizeCapacity } from '@/lib/datamart-util';

const attemptsCollection = () => adminDb.collection('datamart_purchase_attempts');

const attemptStore: PurchaseAttemptStore = {
  async get(id) {
    const snap = await attemptsCollection().doc(id).get();
    if (!snap.exists) {
      return null;
    }
    const data = snap.data()!;
    return {
      id,
      idempotencyKey: data.idempotencyKey,
      status: data.status,
      transactionId: data.transactionId,
      datamartData: data.datamartData,
      error: data.error,
      createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt,
    };
  },
  async create(id, attempt) {
    await attemptsCollection().doc(id).create({
      ...attempt,
      id,
    });
  },
  async update(id, patch) {
    await attemptsCollection().doc(id).update(patch);
  },
};

interface PurchaseBody {
  phoneNumber?: string;
  network?: string;
  capacity?: string;
  userId?: string;
  email?: string;
  bundleName?: string;
}

export async function POST(req: Request) {
  const body: PurchaseBody = await req.json().catch(() => ({}));
  const { phoneNumber, network, capacity, userId, email, bundleName } = body;

  console.log("🔄 Datamart purchase request:", {
    phoneNumber,
    network,
    capacity,
    userId,
    email,
    bundleName,
  });

  // Validate required fields
  if (!phoneNumber || !network || !capacity) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: phoneNumber, network, capacity" },
      { status: 400 }
    );
  }

  let userRole = 'customer';
  let gateway: 'wallet' | 'paystack' = 'paystack';

  // Check if user is admin (if userId provided)
  if (userId) {
    try {
      const userRecord = await adminAuth.getUser(userId);
      userRole = userRecord.customClaims?.role || 'customer';

      if (userRole === 'admin') {
        gateway = 'wallet';
        console.log(`👑 Admin user ${userId} using wallet gateway`);
      } else {
        console.log(`👤 Customer user ${userId} using Paystack gateway`);
      }
    } catch (error) {
      console.warn(`Could not verify user role for ${userId}, defaulting to customer:`, error);
      userRole = 'customer';
      gateway = 'paystack';
    }
  }

  // Additional safeguard: If somehow an admin user gets through with paystack gateway, force wallet
  if (userRole === 'admin' && gateway === 'paystack') {
    console.warn(`⚠️ CRITICAL: Admin user ${userId} was set to use Paystack! Forcing wallet gateway.`);
    gateway = 'wallet';
  }

  // Format phone number and network for Datamart API
  const formattedPhone = DatamartAPIService.formatPhoneNumber(phoneNumber);
  const datamartNetwork = DatamartAPIService.getNetworkIdentifier(network);

  // Prepare Datamart purchase request
  const datamartRequest: DatamartPurchaseRequest = {
    phoneNumber: formattedPhone,
    network: datamartNetwork,
    capacity,
    gateway,
  };

  const logicalParams: LogicalPurchaseParams = {
    gateway,
    userId,
    phoneNumber: formattedPhone,
    network: datamartNetwork,
    capacity,
  };

  console.log(`🔄 Datamart API request:`, datamartRequest);
  console.log(`🔄 Logical purchase id: ${createLogicalPurchaseId(logicalParams)}`);

  // Idempotent purchase — reuses the same X-Idempotency-Key on retries of the
  // same logical purchase, replays stored successes, and surfaces 409 when the
  // same purchase is already in flight.
  const outcome = await executePurchaseWithIdempotency(
    attemptStore,
    (request, idempotencyKey) => datamartAPI.purchaseBundle(request, idempotencyKey),
    logicalParams,
    datamartRequest
  );

  if (outcome.outcome === "in_progress") {
    return NextResponse.json(
      {
        success: false,
        error: safeDatamartMessage(outcome.error),
        code: outcome.error.code,
        inProgress: true,
      },
      { status: 409 }
    );
  }

  if (outcome.outcome === "retryable") {
    console.warn(`🔄 Datamart purchase retryable for ${logicalParams.phoneNumber}:`, outcome.error);
    return NextResponse.json(
      {
        success: false,
        error: safeDatamartMessage(outcome.error),
        code: outcome.error.code,
        retryable: true,
      },
      { status: 502 }
    );
  }

  if (outcome.outcome === "failed") {
    const { error } = outcome;
    const status = httpStatusForDatamartError(error);
    // Insufficient balance must be HTTP 400 (never 402).
    console.error("❌ Datamart purchase failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return NextResponse.json(
      {
        success: false,
        error: safeDatamartMessage(error),
        code: error.code,
        details:
          error.code === "INSUFFICIENT_BALANCE"
            ? "Please top up your Datamart wallet to continue"
            : error.message,
      },
      { status }
    );
  }

  // success
  const { response, idempotencyKey, attempt } = outcome;
  if (response.status !== 'success') {
    throw new DatamartError(
      "UNKNOWN",
      500,
      (response.data as { message?: string })?.message || 'Datamart purchase failed'
    );
  }
  const data = response.data;

  // If this idempotency key already produced a local transaction, replay it —
  // never create a duplicate record for the same DataMart order.
  if (attempt.transactionId) {
    const existing = await adminDb.collection('transactions').doc(attempt.transactionId).get();
    if (existing.exists) {
      return successResponse(
        existing.id,
        existing.data()!,
        idempotencyKey,
        gateway,
        userRole,
        phoneNumber,
        network,
        capacity,
        bundleName
      );
    }
  }

  // Log the transaction in our database
  const transactionData = {
    reference: data.transactionReference,
    userId: userId || null,
    email: email || null,
    phoneNumber: phoneNumber,
    bundleName: bundleName || `${capacity}GB ${network} Bundle`,
    amount: data.price,
    network: network,
    capacity: capacity,
    status: data.orderStatus || 'completed',
    type: 'purchase', // Add type field for wallet balance API
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    gateway: gateway,
    userRole: userRole,
    datamartPurchaseId: data.purchaseId,
    datamartTransactionRef: data.transactionReference,
    datamartOrderReference: data.orderReference,
    datamartBalanceBefore: data.balanceBefore,
    datamartBalanceAfter: data.balanceAfter,
    datamartOrderStatus: data.orderStatus,
    datamartProcessingMethod: data.processingMethod,
    datamartIdempotencyKey: idempotencyKey,
    datamartRateLimit: response.rateLimit ?? null,
    paymentMethod: gateway === 'wallet' ? 'datamart_wallet' : 'paystack',
    adminPurchase: userRole === 'admin'
  };

  const transactionRef = await adminDb.collection('transactions').add(transactionData);
  console.log("✅ Transaction logged in database:", transactionRef.id);

  // Link the idempotency attempt to the created transaction so replays reuse it.
  await attemptStore.update(createLogicalPurchaseId(logicalParams), {
    transactionId: transactionRef.id,
  });

  // Send SMS notifications after successful purchase
  try {
    const bundleDetails = bundleName || `${capacity}GB ${network} Bundle`;

    if (userRole === 'admin') {
      // Send admin purchase notification
      const adminMessage = processSmsTemplate(SMS_TEMPLATES.ADMIN_PURCHASE, {
        bundle: bundleDetails,
        admin: 'Admin User'
      });

      await sendSms(phoneNumber, adminMessage, data.transactionReference);
      console.log(`📱 Admin purchase SMS sent to ${phoneNumber}`);
    } else {
      // Send regular purchase confirmation
      const purchaseMessage = processSmsTemplate(SMS_TEMPLATES.BUNDLE_PURCHASED, {
        bundle: bundleDetails
      });

      await sendSms(phoneNumber, purchaseMessage, data.transactionReference);
      console.log(`📱 Bundle purchase SMS sent to ${phoneNumber}`);
    }
  } catch (smsError) {
    console.error('Bundle purchase SMS failed:', smsError);
    // Don't fail the purchase if SMS fails
  }

  return successResponse(
    transactionRef.id,
    transactionData as any,
    idempotencyKey,
    gateway,
    userRole,
    phoneNumber,
    network,
    capacity,
    bundleName
  );
}

function successResponse(
  transactionId: string,
  data: any,
  idempotencyKey: string,
  gateway: 'wallet' | 'paystack',
  userRole: string,
  phoneNumber: string,
  network: string,
  capacity: string,
  bundleName?: string
) {
  const base = {
    transactionId,
    datamartPurchaseId: data.datamartPurchaseId,
    orderReference: data.datamartOrderReference,
    orderStatus: data.datamartOrderStatus || 'completed',
    balanceBefore: data.datamartBalanceBefore,
    balanceAfter: data.datamartBalanceAfter,
    // Backward-compatible alias used by the older UI
    remainingBalance: data.datamartBalanceAfter,
    bundleName: bundleName || data.bundleName || `${capacity}GB ${network} Bundle`,
    phoneNumber,
    network,
    capacity: normalizeCapacity(capacity),
    amount: data.amount,
    idempotencyKey,
  };

  if (gateway === 'wallet') {
    // Admin wallet purchase - return success immediately
    return NextResponse.json({
      success: true,
      message: "Bundle purchased successfully using Datamart wallet",
      data: base,
    });
  }

  // Customer Paystack purchase - return Paystack redirect URL
  if (userRole === 'admin') {
    console.error(`❌ CRITICAL: Admin user reached Paystack flow! This should never happen.`);
    return NextResponse.json(
      {
        success: false,
        error: "System error: Admin user incorrectly routed to payment flow",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Bundle purchase initiated, redirecting to Paystack",
    data: {
      transactionId,
      requiresPayment: true,
      amount: data.amount,
      phoneNumber,
      network,
      capacity,
    },
  });
}
