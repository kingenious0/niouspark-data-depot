// Quick script to fix existing transactions that don't have the 'type' field
// This can be run in the Firebase console or as a Cloud Function

const admin = require('firebase-admin');

async function fixTransactionTypes() {
  try {
    console.log('🔍 Fetching transactions without type field...');
    
    const transactionsSnapshot = await admin.firestore()
      .collection('transactions')
      .get();
    
    let updatedCount = 0;
    const batch = admin.firestore().batch();
    
    transactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // If transaction doesn't have type field, add it
      if (!data.type) {
        batch.update(doc.ref, {
          type: 'purchase',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
        console.log(`📝 Will update transaction ${doc.id}: ${data.bundleName || 'Unknown bundle'}`);
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updatedCount} transactions with type field`);
    } else {
      console.log('✅ All transactions already have type field');
    }
    
  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
  }
}

// Uncomment to run
// fixTransactionTypes();
