
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export type DatamartBundle = {
    capacity: string;
    mb: string;
    price: string;
    network: 'TELECEL' | 'YELLO' | 'AT_PREMIUM';
};

type DatamartBundlesResponse = {
    status: 'success' | 'error';
    data: DatamartBundle[];
    message?: string;
}

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'abandoned'
  | 'success';


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


const getApiKey = () => {
    // This key is for the external Datamart API, not Firebase
    const apiKey = process.env.DATAMART_API_KEY;
    if (!apiKey) {
        console.warn("DATAMART_API_KEY is not set. External API calls may fail.");
    }
    return apiKey;
}

export async function fetchBundles(network: 'TELECEL' | 'YELLO' | 'AT_PREMIUM'): Promise<DatamartBundle[]> {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return [];
        const response = await fetch(`https://datamartbackened.onrender.com/api/developer/data-packages?network=${network}`, {
            headers: {
                'X-API-Key': apiKey,
            },
            cache: 'no-store' // Fetch fresh data on each request
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to fetch ${network} bundles. Status: ${response.status}, Body: ${errorBody}`);
            return [];
        }

        const result: DatamartBundlesResponse = await response.json();

        if (result.status === 'success') {
            return result.data;
        } else {
            console.error(`API error for ${network}: ${result.message}`);
            return [];
        }
    } catch (error) {
        console.error(`An error occurred while fetching ${network} bundles:`, error);
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
                phoneNumber: data.phone, // Use phone field
                network: data.network,
            });
        });
        
        return transactions;

    } catch (error) {
        console.error("Error fetching user transactions from Firestore:", error);
        return [];
    }
}
