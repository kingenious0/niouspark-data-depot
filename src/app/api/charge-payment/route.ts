   metadata: { bundleId, bundleName, phone, firestoreDocId: docRef.id, userId },
      }),
    });

    const data = await paystackRes.json();
    console.log("💳 Paystack init response:", data);

    if (!paystackRes.ok || !data.status) {
       // If Paystack fails, update our transaction to 'failed'
       await docRef.update({ status: 'failed', updatedAt: Timestamp.now() });
      return NextResponse.json({ success: false, error: data.message || "Charge initiation failed" }, { status: 400 });
    }
    
    // On successful initialization, the status remains 'pending'.
    // The webhook will handle the update to 'completed' or 'failed'.
    console.log(`Transaction ${docRef.id} successfully initialized with Paystack. Status remains 'pending'.`);


    return NextResponse.json({ success: true, data: data.data });
  } catch (err: any) {
    console.error("🔥 Charge API error:", err);
    // If an error occurs after the doc has been created, mark it as failed.
    if(docRef) {
      await docRef.update({ status: 'failed', updatedAt: Timestamp.now(), error: err.message });
    }
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
}