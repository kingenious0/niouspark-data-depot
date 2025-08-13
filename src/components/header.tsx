
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, User, Shield, LogOut, LogIn, Loader2 } from "lucide-react";
import Logo from "./logo";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/bundles", label: "Bundles" },
];

const Header = () => {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const MobileNavContent = () => (
    <>
       <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
       <div className="flex flex-col gap-6 p-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-4">
          {[...navLinks, ...(user ? [{ href: "/account", label: "Account" }] : [])].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-lg font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : ""
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "text-lg font-medium transition-colors hover:text-primary",
                pathname.startsWith("/admin") ? "text-primary" : ""
              )}
            >
              Admin
            </Link>
          )}
           {isAdmin && (
            <Link
              href="/predict"
              className={cn(
                "text-lg font-medium transition-colors hover:text-primary",
                pathname.startsWith("/predict") ? "text-primary" : ""
              )}
            >
              Predict
            </Link>
          )}
        </nav>
        <div className="border-t pt-6 flex flex-col gap-4">
          {user ? (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
          <div className="self-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isClient && user && (
             <Link
              href="/account"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith('/account') ? "text-primary" : "text-muted-foreground"
              )}
            >
              Account
            </Link>
           )}
          {isClient && isAdmin && (
            <>
            <Link
              href="/admin"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
              )}
            >
               <Shield className="mr-2 h-4 w-4 inline-block" />
              Admin
            </Link>
            <Link
              href="/predict"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith("/predict") ? "text-primary" : "text-muted-foreground"
              )}
            >
               AI Predict
            </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
            {!isClient || loading ? (
                <div className="w-20 h-9"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
                <>
                {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
                ) : (
                <>
                    <Button asChild variant="ghost" size="sm">
                    <Link href="/login"> <LogIn className="mr-2 h-4 w-4" /> Login</Link>
                    </Button>
                    <Button asChild size="sm">
                    <Link href="/signup">Sign Up</Link>
                    </Button>
                </>
                )}
                </>
            )}
            </div>
             <ThemeToggle />
            <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0">
                {isClient && <MobileNavContent />}
                </SheetContent>
            </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
