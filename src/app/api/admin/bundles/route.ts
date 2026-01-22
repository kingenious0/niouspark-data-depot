
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { fetchBundles } from '@/lib/datamart';

export const dynamic = 'force-dynamic';

// GET: Fetch current bundles for all networks (live from DataMart + settings)
export async function GET(req: Request) {
    try {
        const headersList = await headers();
        const authorization = headersList.get('Authorization');

        // Auth check
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check logic...
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Fetch API bundles for all networks
        const [mtn, telecel, at] = await Promise.all([
            fetchBundles('YELLO'),
            fetchBundles('TELECEL'),
            fetchBundles('AT_PREMIUM')
        ]);

        // Fetch override settings from Firestore
        // Structure: collection('bundle_settings').doc('network_id') or flat list?
        // Let's us a flat collection 'bundles' where doc ID is the bundle ID (e.g. 'YELLO-1000')
        const settingsSnapshot = await adminDb.collection('bundle_settings').get();
        const settingsMap: Record<string, any> = {};

        settingsSnapshot.forEach(doc => {
            settingsMap[doc.id] = doc.data();
        });

        // Merge logic
        const mergeBundles = (bundles: any[], network: string) => {
            return bundles.map(b => {
                const id = `${network}-${b.capacity}`;
                const setting = settingsMap[id];

                // Base bundle from API
                let finalBundle = {
                    ...b,
                    id,
                    network,
                    // Default logic we implemented in lib/datamart currently (e.g. markup)
                    // NOTE: The fetchBundles already applies the hardcoded logic.
                    // The CMS should let us OVERRIDE that.
                };

                if (setting) {
                    if (setting.customPrice) finalBundle.price = setting.customPrice;
                    if (setting.available !== undefined) finalBundle.available = setting.available;
                    if (setting.customName) finalBundle.name = setting.customName;
                }

                return finalBundle;
            });
        };

        const allBundles = {
            mtn: mergeBundles(mtn, 'YELLO'),
            telecel: mergeBundles(telecel, 'TELECEL'),
            at: mergeBundles(at, 'AT_PREMIUM')
        };

        return NextResponse.json({ success: true, data: allBundles });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Update a bundle setting
export async function POST(req: Request) {
    try {
        const headersList = await headers();
        const authorization = headersList.get('Authorization');

        // Auth check...
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { bundleId, price, available, name } = body;

        if (!bundleId) {
            return NextResponse.json({ success: false, error: 'Missing bundleId' }, { status: 400 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (price !== undefined) updateData.customPrice = price;
        if (available !== undefined) updateData.available = available;
        if (name !== undefined) updateData.customName = name;

        // Save to Firestore
        await adminDb.collection('bundle_settings').doc(bundleId).set(updateData, { merge: true });

        return NextResponse.json({ success: true, message: 'Bundle updated successfully' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
