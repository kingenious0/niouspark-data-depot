import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const networks = [
    {
        name: "MTN",
        page: "/bundles/mtn",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg",
        description: "Bundles for MTN network.",
        hint: "mtn logo"
    },
    {
        name: "AirtelTigo",
        page: "/bundles/airteltigo",
        logo: "https://play-lh.googleusercontent.com/yZFOhTvnlb2Ply82l8bXusA3OAhYopla9750NcqsjqcUNAd4acuohCTAlqHR9_bKrqE",
        description: "Bundles for AirtelTigo network.",
        hint: "airteltigo logo"
    },
    {
        name: "Telecel",
        page: "/bundles/telecel",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYqBE5Z2TJCiY6TNe5xgJLiOJLgcxnjyddKw&s",
        description: "Bundles for Telecel (Vodafone) network.",
        hint: "telecel logo"
    }
]

export default function BundlesPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            Explore Our Data Bundles
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Select a network provider to see available data bundles.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {networks.map((network) => (
             <Link href={network.page} key={network.name} className="block hover:scale-[1.02] transition-all duration-300">
                <Card className="h-full flex flex-col justify-between shadow-lg hover:shadow-primary/20">
                    <CardHeader className="flex-row items-center gap-4">
                        <Image src={network.logo} width={64} height={64} alt={`${network.name} logo`} className="rounded-full object-contain" data-ai-hint={network.hint} />
                        <div>
                            <CardTitle className="font-headline text-2xl">{network.name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{network.description}</p>
                    </CardContent>
                    <CardContent className="flex justify-end">
                        <ArrowRight className="w-6 h-6 text-primary"/>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
