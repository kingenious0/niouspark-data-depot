import BundleCard from "@/components/bundle-card";
import { getBundlesWithSettings } from "@/lib/bundles-server";

export default async function TelecelBundlesPage() {
  const bundles = await getBundlesWithSettings('TELECEL');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="relative overflow-hidden w-full py-16 md:py-24">
        <div className="absolute inset-0 bg-[#E30613]/10 dark:bg-[#E30613]/5 -z-10 blur-3xl rounded-full opacity-40 dark:opacity-20 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tighter text-slate-900 dark:text-white">
              Telecel <span className="text-[#E30613]">Bundles</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light">
              Premium connectivity with blazing fast 4G+ speeds. Experience the new network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.capacity} bundle={{
                id: bundle.id,
                name: bundle.name || `${bundle.capacity}GB Bundle`,
                data: `${bundle.mb} MB`,
                price: parseFloat(bundle.price),
                validity: 'Non-Expiry',
                available: bundle.available,
                capacity: bundle.capacity,
                network: bundle.network
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}