import BundleCard from "@/components/bundle-card";
import { fetchBundles, DatamartBundle } from "@/lib/datamart";

export const dynamic = 'force-dynamic';

const mtnCustomPrices: { [key: string]: string } = {
  "1": "5.00",
  "2": "10.50",
  "3": "15.00",
  "4": "20.00",
  "5": "25.00",
  "6": "29.00",
  "8": "38.00",
  "10": "46.00",
  "15": "66.00",
  "20": "87.00",
  "25": "110.00",
  "30": "132.00",
  "40": "173.00",
  "50": "216.00",
  "100": "422.00"
};


export default async function MtnBundlesPage() {
  const bundlesFromApi = await fetchBundles('YELLO');

  const bundles = bundlesFromApi.map((bundle: DatamartBundle) => {
    const capacityKey = bundle.capacity;
    const customPrice = mtnCustomPrices[capacityKey];
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
            MTN Bundles
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Find the perfect MTN plan that fits your needs. Fast, reliable, and affordable.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.capacity} bundle={{
                id: `YELLO-${bundle.capacity}`,
                name: `${bundle.capacity}GB Bundle`,
                data: `${bundle.mb} MB`,
                price: parseFloat(bundle.price),
                validity: 'Non-Expi'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
