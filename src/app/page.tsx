import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Cpu, ShieldCheck, Wifi, Wand2, FileText, Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const mainServices = [
    {
      icon: <Wifi className="h-16 w-16 text-blue-600" />,
      title: 'Data Bundles',
      subtitle: 'Stay Connected',
      description: 'Purchase affordable data bundles for all major networks in Ghana. Fast, reliable, and instant delivery.',
      features: ['Multiple Networks', 'Instant Delivery', 'Secure Payment'],
      buttonText: 'Browse Bundles',
      buttonHref: '/bundles',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Wand2 className="h-16 w-16 text-purple-600" />,
      title: 'AI Paraphraser',
      subtitle: 'Transform Your Text',
      description: 'Advanced AI-powered text paraphrasing and humanization. Perfect for students, writers, and professionals.',
      features: ['PDF/DOCX Support', 'Multiple Modes', 'Human-like Output'],
      buttonText: 'Try AI Paraphraser',
      buttonHref: '/paraphraser',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const features = [
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: 'Lightning Fast',
      description: 'Get instant results whether you\'re buying data or paraphrasing text.',
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: 'Secure & Private',
      description: 'Your data and documents are processed securely with complete privacy.',
    },
    {
      icon: <Cpu className="h-10 w-10 text-primary" />,
      title: 'AI-Powered',
      description: 'Leverage cutting-edge AI technology for smarter predictions and better results.',
    },
  ];

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] md:h-[90vh] flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 z-10"></div>
          <video
            src="https://cdn.pixabay.com/video/2022/06/04/119290-717347154_tiny.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
          ></video>
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-headline tracking-tight mb-6">
                Your All-in-One Digital Platform
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                Stay connected with affordable data bundles and transform your text with AI-powered paraphrasing.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Button asChild size="lg" className="font-bold text-lg px-8 py-3">
                  <Link href="/bundles">
                    <Wifi className="mr-2 h-5 w-5" />
                    Data Bundles
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="font-bold text-lg px-8 py-3 text-primary">
                  <Link href="/paraphraser">
                    <Wand2 className="mr-2 h-5 w-5" />
                    AI Paraphraser
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Services Section */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
                Choose Your Service
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Whether you need to stay connected or transform your text, we've got you covered.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {mainServices.map((service, index) => (
                <Card key={index} className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <CardContent className="p-8 md:p-12">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="bg-white rounded-full p-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {service.subtitle}
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                          {service.title}
                        </h3>
                        <p className="text-lg text-muted-foreground mb-6 max-w-md">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {service.features.map((feature, idx) => (
                          <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Button asChild size="lg" className="font-bold group-hover:scale-105 transition-transform duration-300">
                        <Link href={service.buttonHref}>
                          {service.buttonText}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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