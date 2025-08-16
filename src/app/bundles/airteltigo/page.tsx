import BundleCard from "@/components/bundle-card";
import { fetchBundles } from "@/lib/datamart";

export default async function AirteltigoBundlesPage() {
  const bundles = await fetchBundles("AT_PREMIUM");

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            AirtelTigo Bundles
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Find the perfect AirtelTigo plan that fits your needs. Fast, reliable,
            and affordable.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.capacity}
              bundle={{
                id: `AT_PREMIUM-${bundle.capacity}`,
                name: `${bundle.capacity}GB Bundle`,
                data: `${bundle.mb} MB`,
                price: parseFloat(bundle.price),
                validity: "30 Days",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
