
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Cpu, ShieldCheck, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: <Wifi className="h-10 w-10 text-primary" />,
      title: 'Wide Selection',
      description: 'Choose from a variety of data bundles tailored to your needs, from daily plans to monthly subscriptions.',
    },
    {
      icon: <Cpu className="h-10 w-10 text-primary" />,
      title: 'AI-Powered Predictions',
      description: 'Leverage our cutting-edge AI to forecast the most popular data bundles, helping you make smarter choices.',
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: 'Secure & Instant',
      description: 'Enjoy a seamless and secure purchasing experience with instant delivery of your data bundles.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 z-10"></div>
          <video
            src="https://cdn.pixabay.com/video/2022/06/04/119290-717347154_tiny.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
          ></video>
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-white">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline tracking-tight">
                Stay Connected with Niouspark Data Bundles
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/90">
                The fastest, most reliable, and affordable data bundles right at your fingertips.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg" className="font-bold">
                  <Link href="/bundles">Browse Bundles</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="font-bold text-primary">
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">
                Why Choose Us?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                We provide the best data bundle services with reliability and at an affordable price.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="text-center shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="w-full py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-headline">
                  Get Your Data in 3 Simple Steps
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Purchasing data has never been this easy. Follow our simple process to get connected in minutes.
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold font-headline">1. Select Your Bundle</h3>
                      <p className="text-muted-foreground">Browse our diverse range of data bundles and pick the one that fits your lifestyle.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold font-headline">2. Provide Phone Number</h3>
                      <p className="text-muted-foreground">Enter the phone number you want to top up. You can purchase for yourself or a friend.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold font-headline">3. Secure Payment</h3>
                      <p className="text-muted-foreground">Complete the purchase through our secure payment gateway and receive your data instantly.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Image
                  src="/3 Steps.png"
                  alt="Mobile app illustration"
                  width={500}
                  height={500}
                  className="rounded-lg shadow-2xl"
                  data-ai-hint="mobile phone"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Get Started?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg opacity-90">
              Join thousands of satisfied customers and enjoy uninterrupted internet access. Explore our bundles now!
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary" className="font-bold text-primary">
                <Link href="/bundles">Explore Data Bundles</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
