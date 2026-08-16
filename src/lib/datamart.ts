import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { normalizeCapacity } from "@/lib/datamart-util";
import { DatamartError, mapDatamartHttpError } from "@/lib/datamart-errors";

export type DatamartBundle = {
    capacity: string;
    mb: string;
    price: string;
    network: 'TELECEL' | 'YELLO' | 'AT_PREMIUM';
    available?: boolean; // Bundle availability status
};

type DatamartBundlesResponse = {
    status: 'success' | 'error';
    data: DatamartBundle[];
    message?: string;
}

// New API response format - returns all networks in one call
type NewDatamartBundlesResponse = {
    status: 'success' | 'error';
    data: {
        TELECEL: DatamartBundle[];
        YELLO: DatamartBundle[];
        AT_PREMIUM: DatamartBundle[];
        at?: DatamartBundle[]; // The API also returns 'at' network
    };
    message?: string;
}

export type TransactionStatus =
    | 'completed'
    | 'pending'
    | 'failed'
    | 'abandoned'
    | 'success'
    | 'delivering'
    | 'delivery_failed'
    | 'waiting'
    | 'processing'
    | 'refunded';


export type Transaction = {
    _id: string;
    amount: number;
    status: TransactionStatus;
    reference: string;
    createdAt: string;
    type: 'purchase' | string;
    userId?: string;
    bundleName?: string;
    phoneNumber?: string;
    network?: string;
};

// This type represents a transaction fetched via the Admin SDK
export type AdminTransaction = Transaction & {
    userName?: string;
    email?: string;
}

const DATAMART_BASE_URL = 'https://api.datamartgh.shop/api/developer';
const API_TIMEOUT = 8000; // 8 seconds

const getApiKey = () => {
    // This key is for the external Datamart API, not Firebase
    const apiKey = process.env.DATAMART_API_KEY;
    if (!apiKey) {
        console.warn("DATAMART_API_KEY is not set. External API calls may fail.");
    }
    return apiKey;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

export async function fetchBundles(network: 'TELECEL' | 'YELLO' | 'AT_PREMIUM'): Promise<DatamartBundle[]> {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return [];

        // The new API returns all networks in one call, no network query parameter needed
        const response = await fetchWithTimeout(`${DATAMART_BASE_URL}/data-packages`, {
            headers: {
                'X-API-Key': apiKey,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to fetch bundles. Status: ${response.status}, Body: ${errorBody}`);
            return [];
        }

        const result: NewDatamartBundlesResponse = await response.json();

        if (result.status === 'success') {
            // Extract the specific network's bundles from the response
            const networkBundles = result.data[network] || [];

            // Ensure all bundles have the correct network field set and handle availability
            return networkBundles.map(bundle => {
                let isAvailable = true;
                let finalPrice = bundle.price;

                // Pricing and availability logic
                if (network === 'TELECEL') {
                    // Make all Telecel bundles unavailable as per requirement
                    isAvailable = false;
                } else if (network === 'YELLO') {
                    // Add 0.70 markup to MTN bundles
                    // Parse, add markup, and fix to 2 decimals
                    const originalPrice = parseFloat(bundle.price);
                    if (!isNaN(originalPrice)) {
                        finalPrice = (originalPrice + 0.70).toFixed(2);
                    }
                }
                // AT_PREMIUM (AirtelTigo) remains as is (DataMart price)

                return {
                    ...bundle,
                    price: finalPrice,
                    network: network,
                    available: isAvailable
                };
            });
        } else {
            console.error(`API error for ${network}: ${result.message}`);
            return [];
        }
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.error(`Request to fetch ${network} bundles timed out.`);
        } else {
            console.error(`An error occurred while fetching ${network} bundles:`, error);
        }
        return [];
    }
}

export async function fetchUserTransactions(userId: string): Promise<Transaction[]> {
    if (!userId) {
        return [];
    }

    try {
        const q = query(
            collection(db, "transactions"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Firestore timestamps need to be converted to ISO strings
            const createdAt = (data.createdAt as Timestamp).toDate().toISOString();
            transactions.push({
                _id: doc.id,
                amount: data.amount,
                status: data.status,
                reference: data.reference,
                createdAt: createdAt,
                type: 'purchase',
                userId: data.userId,
                bundleName: data.bundleName,
                phoneNumber: data.phoneNumber || data.phone, // Check both possibilities
                network: data.network,
            });
        });

        return transactions;

    } catch (error) {
        console.error("Error fetching user transactions from Firestore:", error);
        return [];
    }
}

/**
 * Delivers a data bundle to a specified phone number by calling the DataMart API.
 * @param phone The phone number to deliver the bundle to.
 * @param bundleId The ID of the bundle from DataMart (e.g., 'YELLO-5').
 * @param idempotencyKey Optional UUID. One per logical purchase — reused on
 *   retry so DataMart returns the original response instead of double-charging.
 * @returns The result from the DataMart API.
 */
export async function deliverDataBundle(phone: string, bundleId: string, idempotencyKey?: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("DATAMART_API_KEY is not configured on the server.");
    }

    const [network, capacity] = bundleId.split('-');

    if (!network || !capacity) {
        throw new Error(`Invalid bundleId format: ${bundleId}. Expected 'NETWORK-CAPACITY'.`);
    }

    // DataMart expects a plain GB number ("5"), not a display string ("5GB").
    const normalizedCapacity = normalizeCapacity(capacity);

    console.log(`Attempting to deliver bundle. Phone: ${phone}, Network: ${network}, Capacity: ${normalizedCapacity}GB`);

    try {
        const response = await fetchWithTimeout(`${DATAMART_BASE_URL}/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
            },
            body: JSON.stringify({
                phone,
                network,
                capacity: normalizedCapacity,
            }),
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
            const errorMessage = result.message || 'Unknown error from DataMart API.';
            console.error(`DataMart API Error: ${errorMessage}`, result);
            throw mapDatamartHttpError(response.status, result, `Failed to deliver bundle: ${errorMessage}`);
        }

        console.log('Successfully initiated data bundle delivery via DataMart.', result);
        return result;

    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            throw new DatamartError(
                'TIMEOUT',
                0,
                "The request to the data provider timed out. Please check your transaction history later."
            );
        }
        // Re-throw DatamartErrors so callers can distinguish retryable cases
        if (error instanceof DatamartError) {
            throw error;
        }
        // Re-throw other errors to be caught by the webhook logic
        throw error;
    }
}


export async function fetchWalletBalance(): Promise<number | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("DATAMART_API_KEY is not configured on the server.");
    }

    console.log("Fetching DataMart wallet balance...");

    try {
        const response = await fetchWithTimeout(`${DATAMART_BASE_URL}/balance`, {
            headers: {
                'X-API-Key': apiKey,
            },
            cache: 'no-store'
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
            const errorMessage = result.message || 'Unknown error fetching balance from DataMart API.';
            console.error(`DataMart API Error: ${errorMessage}`, result);
            throw new Error(`Failed to fetch wallet balance: ${errorMessage}`);
        }

        console.log("Successfully fetched wallet balance:", result.data.balance);
        return parseFloat(result.data.balance);
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.error('Request to fetch wallet balance timed out.');
        } else {
            console.error('An error occurred while fetching wallet balance:', error);
        }
        return null; // Return null on any error to allow graceful UI fallback
    }
}