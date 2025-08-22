import admin from 'firebase-admin';
import type { AdminTransaction } from './datamart';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Go to your Firebase Project settings > Service accounts. Generate a new private key, then encode it to Base64. (e.g. using a site like base64encode.org) and add it to your .env file.');
}

if (!admin.apps.length) {
    try {
        const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e: any) {
        throw new Error(`Failed to parse or initialize Firebase Admin SDK. Make sure the FIREBASE_SERVICE_ACCOUNT_KEY is a valid Base64 encoded JSON. Error: ${e.message}`);
    }
}


const adminDb = admin.firestore();
const adminAuth = admin.auth();

export async function fetchAllTransactionsFromAdmin(): Promise<AdminTransaction[]> {
    try {
        const snapshot = await adminDb.collection("transactions").orderBy("createdAt", "desc").get();
        
        if (snapshot.empty) {
            return [];
        }

        const userPromises = snapshot.docs.map(doc => {
            const userId = doc.data().userId;
            if (userId) {
                return adminAuth.getUser(userId).catch(err => {
                    console.error(`Failed to fetch user ${userId}`, err);
                    return null; // Return null if user not found or on error
                });
            }
            return Promise.resolve(null);
        });
        
        const userResults = await Promise.all(userPromises);
        
        const userMap = userResults.reduce((acc, user) => {
            if (user) {
                acc[user.uid] = user;
            }
            return acc;
        }, {} as { [key: string]: admin.auth.UserRecord });


        const transactions: AdminTransaction[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const user = data.userId ? userMap[data.userId] : null;

            let createdAt = '';
            if (data.createdAt) {
                if (data.createdAt.toDate) { 
                    createdAt = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                    createdAt = data.createdAt;
                }
            }
            
            return {
                _id: doc.id,
                amount: data.amount,
                status: data.status || 'completed',
                reference: data.reference,
                createdAt: createdAt,
                type: data.type || 'purchase',
                userId: data.userId,
                bundleName: data.bundleName,
                phoneNumber: data.phone, // Use phone field
                network: data.network,
                userName: user?.displayName || 'N/A',
                email: user?.email || 'N/A',
            };
        });

        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return transactions;
    } catch (error) {
        console.error("Error fetching all transactions from Admin SDK:", error);
        return [];
    }
}

export async function setUserRole(uid: string, role: 'admin' | 'customer'): Promise<void> {
  try {
    // Set the custom claim on the user
    await adminAuth.setCustomUserClaims(uid, { role });
    
    // Also update the role in Firestore for consistency
    await adminDb.collection('users').doc(uid).set({ role }, { merge: true });
    
    console.log(`Successfully set role '${role}' for user ${uid}`);
  } catch (error) {
    console.error(`Error setting user role for ${uid}:`, error);
    throw new Error('Failed to set user role.');
  }
}

export async function countAdmins(): Promise<number> {
    try {
        const querySnapshot = await adminDb.collection('users').where('role', '==', 'admin').get();
        return querySnapshot.size;
    } catch (error) {
        console.error("Error counting admin users:", error);
        // In case of error, assume there might be admins to be safe
        return 1;
    }
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying ID token:', error);
        throw new Error('Invalid or expired token');
    }
}

export { adminDb, adminAuth };
