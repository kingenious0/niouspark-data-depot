import axios from 'axios';

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

export interface DatamartPurchaseResponse {
  status: string;
  data: {
    purchaseId: string;
    transactionReference: string;
    network: string;
    capacity: string;
    mb: string;
    price: number;
    remainingBalance: number;
    geonetechResponse: any;
  };
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

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };
  }

  /**
   * Purchase a data bundle using Datamart API
   */
  async purchaseBundle(request: DatamartPurchaseRequest): Promise<DatamartPurchaseResponse> {
    try {
      console.log('🔄 Datamart API: Purchasing bundle:', request);
      
      const response = await axios.post(
        `${this.baseURL}/purchase`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ Datamart API: Purchase successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Datamart API: Purchase failed:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request parameters');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key or unauthorized access');
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient wallet balance');
      } else if (error.response?.status === 500) {
        throw new Error('Datamart service temporarily unavailable');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to purchase bundle');
      }
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
