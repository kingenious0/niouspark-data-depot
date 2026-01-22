import Link from "next/link";
import { Mail, MapPin, Clock } from "lucide-react";
import Logo from "./logo";
import { Badge } from "./ui/badge";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b1120] text-slate-400 border-t border-slate-800 flex-shrink-0 font-sans">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed max-w-xs">
              Your trusted source for affordable data bundles in Ghana. Fast, reliable, and secure connectivity solution for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href="/account/history" className="hover:text-emerald-400 transition-colors">My Orders</Link></li>
              <li><Link href="/account" className="hover:text-emerald-400 transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Data Bundles */}
          <div className="space-y-4">
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Data Bundles</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/bundles/mtn" className="hover:text-emerald-400 transition-colors">MTN Data</Link></li>
              <li><Link href="/bundles/airteltigo" className="hover:text-emerald-400 transition-colors">AirtelTigo Data</Link></li>
              <li className="flex items-center gap-2">
                <Link href="/bundles/telecel" className="hover:text-emerald-400 transition-colors">Telecel Bundle</Link>
                <Badge className="h-5 px-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 text-[10px]">NEW</Badge>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="space-y-4">
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Contact Us</h3>
            <ul className="space-y-4">
              {/* Phone removed as requested */}

              <li className="flex gap-4 group">
                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <Mail className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <a href="mailto:niouspark@gmail.com" className="text-sm font-medium text-white hover:text-emerald-400 transition-colors">niouspark@gmail.com</a>
                </div>
              </li>

              <li className="flex gap-4 group">
                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Location</p>
                  <p className="text-sm font-medium text-white">Kumasi, Ghana</p>
                </div>
              </li>

              <li className="flex gap-4 group">
                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                  <Clock className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Hours</p>
                  <p className="text-sm font-medium text-white">24/7 Always Open</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} Niouspark Data Depot. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;