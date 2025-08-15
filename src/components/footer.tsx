import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import Logo from "./logo";

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t flex-shrink-0">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Your trusted partner for seamless data connectivity.
            </p>
          </div>
          <div>
            <h3 className="font-headline font-semibold">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              <li><Link href="/bundles" className="text-sm hover:text-primary transition-colors">Bundles</Link></li>
              <li><Link href="/account" className="text-sm hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/#features" className="text-sm hover:text-primary transition-colors">Features</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline font-semibold">Support</h3>
            <ul className="mt-2 space-y-2">
              <li><Link href="#" className="text-sm hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-sm hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-sm hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline font-semibold">Follow Us</h3>
            <div className="flex mt-2 space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram /></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Niouspark Data Depot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;