import BundleCard from "@/components/bundle-card";
import { fetchBundles, DatamartBundle } from "@/lib/datamart";

const telecelCustomPrices: { [key: string]: string } = {
  "5": "23.80",
  "8": "37.00",
  "10": "42.00",
  "12": "46.00",
  "15": "61.50",
  "20": "80.00",
  "25": "97.00",
  "30": "118.00",
  "40": "156.00",
  "50": "196.00"
};

export default async function TelecelBundlesPage() {
  const bundlesFromApi = await fetchBundles('TELECEL');

  const bundles = bundlesFromApi.map((bundle: DatamartBundle) => {
    const capacityKey = bundle.capacity;
    const customPrice = telecelCustomPrices[capacityKey];
    return {
      ...bundle,
      price: customPrice ? customPrice : bundle.price, // Use custom price if it exists
    };
  });

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            Telecel Bundles
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Find the perfect Telecel plan that fits your needs. Fast, reliable, and affordable.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.capacity} bundle={{
                id: `TELECEL-${bundle.capacity}`,
                name: `${bundle.capacity}GB Bundle`,
                data: `${bundle.mb} MB`,
                price: parseFloat(bundle.price),
                validity: 'Non-Expiry',
                available: bundle.available !== false // Default to available if not explicitly false
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}