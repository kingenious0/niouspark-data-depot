import axios from 'axios';
import { mapDatamartHttpError } from '@/lib/datamart-errors';
import { normalizeCapacity } from '@/lib/datamart-util';

export interface DatamartBundle {
  capacity: string;
  mb: string;
  price: string;
  network: string;
}

export interface DatamartPurchaseRequest {
  phoneNumber: string;
  network: string;
  capacity: string;
  gateway: 'wallet' | 'paystack';
}

export interface DatamartRateLimit {
  limit: number | null;
  remaining: number;
  resetInSeconds: number;
}

export interface DatamartPurchaseData {
  purchaseId: string;
  orderReference: string;
  transactionReference: string;
  network: string;
  capacity: string;
  price: number;
  balanceBefore: number;
  balanceAfter: number;
  orderStatus: string;
  processingMethod: string;
  geonetechResponse?: any;
}

export interface DatamartPurchaseResponse {
  status: string;
  data: DatamartPurchaseData;
  rateLimit?: DatamartRateLimit | null;
}

export interface DatamartOrderStatusData {
  orderId: string;
  reference: string;
  phoneNumber: string;
  network: string;
  capacity: number;
  price: number;
  orderStatus: string;
  processingMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatamartOrderStatusResponse {
  status: string;
  data: DatamartOrderStatusData;
  rateLimit?: DatamartRateLimit | null;
}

export interface DatamartTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  gateway: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatamartTransactionsResponse {
  status: string;
  data: {
    transactions: DatamartTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

class DatamartAPIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.DATAMART_API_KEY || '';
    this.baseURL = 'https://api.datamartgh.shop/api/developer';

    if (!this.apiKey) {
      console.warn('⚠️ DATAMART_API_KEY not found in environment variables');
    }
  }

  private getHeaders(extra: Record<string, string> = {}) {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...extra,
    };
  }

  /**
   * Purchase a data bundle using Datamart API.
   *
   * `idempotencyKey` — one fresh UUID per logical purchase. Reusing the same key
   * within 24h makes Datamart return the original response (safe to retry on
   * timeout/5xx). A concurrent request with the same key yields `409
   * REQUEST_IN_PROGRESS`.
   */
  async purchaseBundle(
    request: DatamartPurchaseRequest,
    idempotencyKey?: string
  ): Promise<DatamartPurchaseResponse> {
    const payload = {
      ...request,
      capacity: normalizeCapacity(request.capacity),
    };

    try {
      console.log('🔄 Datamart API: Purchasing bundle:', payload);

      const response = await axios.post(
        `${this.baseURL}/purchase`,
        payload,
        {
          headers: this.getHeaders(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
          timeout: 20000,
        }
      );

      console.log('✅ Datamart API: Purchase successful:', response.data);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status as number | undefined;
      const body = error?.response?.data;
      const fallbackMessage = error?.response?.data?.message || error?.message || 'Failed to purchase bundle';
      throw mapDatamartHttpError(status, body, fallbackMessage);
    }
  }

  /**
   * Re-read a purchase's current order status via GET /order-status/:reference.
   * `reference` is the DataMart orderReference (e.g. GN-AB12CD34).
   */
  async getOrderStatus(reference: string): Promise<DatamartOrderStatusResponse> {
    try {
      console.log('🔄 Datamart API: Fetching order status for reference:', reference);

      const response = await axios.get(
        `${this.baseURL}/order-status/${encodeURIComponent(reference)}`,
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      console.log('✅ Datamart API: Order status fetched successfully');
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status as number | undefined;
      const body = error?.response?.data;
      const fallbackMessage = error?.response?.data?.message || error?.message || 'Failed to fetch order status';
      console.error('❌ Datamart API: Failed to fetch order status:', body || error?.message);
      throw mapDatamartHttpError(status, body, fallbackMessage);
    }
  }

  /**
   * Get available data packages for a specific network
   */
  async getDataPackages(network?: string): Promise<DatamartBundle[]> {
    try {
      console.log('🔄 Datamart API: Fetching data packages for network:', network || 'all');

      const url = network ? `${this.baseURL}/data-packages?network=${network}` : `${this.baseURL}/data-packages`;
      const response = await axios.get(url, { headers: this.getHeaders() });

      console.log('✅ Datamart API: Data packages fetched successfully');

      if (network) {
        // Single network response
        return response.data.data || [];
      } else {
        // All networks response - flatten into single array
        const allPackages: DatamartBundle[] = [];
        Object.values(response.data.data).forEach((networkPackages: any) => {
          allPackages.push(...networkPackages);
        });
        return allPackages;
      }
    } catch (error: any) {
      console.error('❌ Datamart API: Failed to fetch data packages:', error.response?.data || error.message);
      throw new Error('Failed to fetch available data packages');
    }
  }

  /**
   * Get transaction history from Datamart
   */
  async getTransactions(page: number = 1, limit: number = 20): Promise<DatamartTransactionsResponse> {
    try {
      console.log('🔄 Datamart API: Fetching transactions, page:', page);

      const response = await axios.get(
        `${this.baseURL}/transactions?page=${page}&limit=${limit}`,
        { headers: this.getHeaders() }
      );

      console.log('✅ Datamart API: Transactions fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Datamart API: Failed to fetch transactions:', error.response?.data || error.message);
      throw new Error('Failed to fetch transaction history');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get network identifier for Datamart API
   */
  static getNetworkIdentifier(network: string): string {
    const networkMap: { [key: string]: string } = {
      'MTN': 'YELLO',
      'YELLO': 'YELLO',
      'AirtelTigo': 'AT_PREMIUM',
      'AT_PREMIUM': 'AT_PREMIUM',
      'Telecel': 'TELECEL',
      'TELECEL': 'TELECEL',
      'Vodafone': 'TELECEL'
    };

    return networkMap[network] || network;
  }

  /**
   * Format phone number for Datamart API (remove +233 if present)
   */
  static formatPhoneNumber(phone: string): string {
    return phone.replace(/^\+233/, '0');
  }
}

// Export singleton instance
export const datamartAPI = new DatamartAPIService();

// Export the class for testing purposes
export { DatamartAPIService };
