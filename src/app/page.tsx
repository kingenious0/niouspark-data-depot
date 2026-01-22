import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ShieldCheck, Zap, ArrowRight, Smartphone, Clock, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const networks = [
    {
      id: 'mtn',
      name: 'MTN',
      color: 'bg-[#FFCC00]',
      textColor: 'text-black',
      description: 'Non-Expiry Data',
      href: '/bundles/mtn',
      price: 'Low Rates'
    },
    {
      id: 'telecel',
      name: 'Telecel',
      color: 'bg-[#E30613]',
      textColor: 'text-white',
      description: 'Super Bundles',
      href: '/bundles/telecel',
      price: 'Best Value'
    },
    {
      id: 'at',
      name: 'AirtelTigo',
      color: 'bg-[#005CA8]',
      textColor: 'text-white',
      description: 'Big Time Data',
      href: '/bundles/airteltigo',
      price: 'Mega Deals'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">

          {/* Background Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          </div>

          <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center gap-12 pt-20">

            {/* Main Headline */}
            <div className="text-center max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 py-1 px-4 mb-4 backdrop-blur-sm bg-emerald-950/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                System Online • Instant Delivery
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline tracking-tight text-white">
                Internet Data at <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Unbeatable Prices
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Connect instantly with Ghana's most reliable data plug.
                Experience <span className="text-white font-medium">non-expiry bundles</span> delivered to your phone in seconds.
              </p>
            </div>

            {/* Quick Buy Widget */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              {networks.map((net) => (
                <Link key={net.id} href={net.href} className="group">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${net.color} ${net.textColor}`}>
                        {net.name[0]}
                      </div>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                        {net.price}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{net.name}</h3>
                    <p className="text-slate-400">{net.description}</p>
                    <div className="mt-6 flex items-center text-sm font-medium text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                      Buy Now <ArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 text-slate-500 text-sm font-medium animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Instant Delivery
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> 24/7 Support
              </div>
            </div>

          </div>
        </section>


        {/* Value Proposition */}
        <section className="py-24 bg-white dark:bg-slate-950">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold font-headline text-slate-900 dark:text-white">
                  Why top Ghanaians choose <span className="text-emerald-600">Niouspark?</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  We've simplified the process of staying connected. No complex codes, no hidden fees—just reliable data delivered straight to your wallet.
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    { title: 'Zero Transaction Fees', desc: 'Pay exactly what you see. We absorb the processing costs.' },
                    { title: 'Non-Expiry Data', desc: 'Your data lasts as long as you need it. No monthly pressure.' },
                    { title: 'Dedicated Support', desc: 'Our team is always online to assist with any delivery issues.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button asChild size="lg" className="mt-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  <Link href="/bundles">Start Buying Now</Link>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl opacity-20 blur-xl animate-pulse" />
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div>
                        <p className="text-sm text-slate-500">Recent Transaction</p>
                        <p className="font-bold text-lg dark:text-white">MTN 10GB Bundle</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div>
                        <p className="text-sm text-slate-500">Time</p>
                        <p className="font-medium dark:text-white">Just now</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Amount</p>
                        <p className="font-bold text-slate-900 dark:text-white">GH₵ 45.00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">You saved <span className="font-bold">GH₵ 15.00</span> compared to direct network purchase.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Teaser (Secondary) */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 text-center">
            <h3 className="text-2xl font-bold font-headline mb-4">More than just data</h3>
            <p className="text-slate-500 max-w-2xl mx-auto mb-12">Explore our suite of AI-powered tools designed to boost your productivity.</p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/paraphraser" className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">AI Paraphraser</p>
                  <p className="text-xs text-slate-500">Humanize AI Text</p>
                </div>
              </Link>

              <Link href="/chat" className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">AI Assistant</p>
                  <p className="text-xs text-slate-500">Chat & Voice Support</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}