
import { fetchBundles as fetchApiBundles, DatamartBundle } from './datamart';
import { adminDb } from './firebase-admin';

export interface BundleSetting {
    customPrice?: string;
    customName?: string;
    available?: boolean;
}

export type EnrichedBundle = DatamartBundle & BundleSetting & { id: string };

export async function getBundlesWithSettings(network: 'TELECEL' | 'YELLO' | 'AT_PREMIUM'): Promise<EnrichedBundle[]> {
    try {
        // 1. Fetch live bundles from DataMart API
        // Note: fetchApiBundles already has some hardcoded logic (MTN markup, Telcel unavailable).
        // We might want to strip that logic eventually, but for now we apply overrides ON TOP of it.
        const apiBundles = await fetchApiBundles(network);

        // 2. Fetch overrides from Firestore
        // We will fetch ALL settings for simplicity or refine query if needed.
        // Optimization: In a real app with many bundles, fetch only relevant docs or cache.
        const settingsSnapshot = await adminDb.collection('bundle_settings').get();
        const settingsMap: Record<string, BundleSetting> = {};

        settingsSnapshot.forEach(doc => {
            settingsMap[doc.id] = doc.data() as BundleSetting;
        });

        // 3. Merge
        return apiBundles.map(bundle => {
            const id = `${network}-${bundle.capacity}`;
            const setting = settingsMap[id];

            let enriched = {
                ...bundle,
                id,
                // Default to API values (which might already be modified by fetchApiBundles)
            };

            if (setting) {
                if (setting.customPrice !== undefined) enriched.price = setting.customPrice;
                if (setting.customName !== undefined) enriched.name = setting.customName;
                if (setting.available !== undefined) enriched.available = setting.available;
            }

            return enriched;
        });

    } catch (error) {
        console.error(`Error fetching bundles with settings for ${network}:`, error);
        return [];
    }
}
