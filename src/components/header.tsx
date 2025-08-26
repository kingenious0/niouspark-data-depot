"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut, Loader2, Cpu, Shield, MessageCircle, ChevronDown } from "lucide-react";
import LogoIcon from "./logo-icon";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  dropdown?: NavItem[];
  requireAdmin?: boolean;
}

const navLinks: NavLink[] = [
  { 
    href: "/", 
    label: "About",
    dropdown: [
      { href: "/", label: "Home" },
      { href: "/about", label: "Company Info" },
      { href: "/contact", label: "Contact" }
    ]
  },
  { 
    href: "/chat", 
    label: "AI Tools",
    dropdown: [
      { href: "/chat", label: "AI Chat (Voice + Text)" },
      { href: "/paraphraser", label: "Paraphraser / Humaniser (Enhanced)" }
    ]
  },
  { 
    href: "/bundles", 
    label: "Bundles",
    dropdown: [
      { href: "/bundles/mtn", label: "MTN Data" },
      { href: "/bundles/airteltigo", label: "AirtelTigo" },
      { href: "/bundles/telecel", label: "Telecel" }
    ]
  },
  { 
    href: "/account", 
    label: "Account",
    dropdown: [
      { href: "/account", label: "Profile / Settings", requireAuth: true },
      { href: "/admin/wallet", label: "DataMart Balance", requireAdmin: true },
      { href: "/account/history", label: "Purchase History", requireAuth: true }
    ]
  },
  { 
    href: "/admin", 
    label: "Admin",
    dropdown: [
      { href: "/admin", label: "Admin Dashboard" },
      { href: "/admin/users", label: "User Management" },
      { href: "/admin/wallet", label: "DataMart Wallet" },
      { href: "/admin/ai", label: "Analytics" },
      { href: "/predict", label: "AI Sales Predictor" }
    ],
    requireAdmin: true
  }
];

const Header = () => {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

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
  
  const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  const MobileNavContent = () => (
    <>
       <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
       <div className="flex flex-col gap-6 p-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
        </Link>
        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => {
            // Hide entire Admin section for non-admin users
            if (link.requireAdmin && !isAdmin) return null;

            const isCurrentPath = pathname === link.href || 
              (link.dropdown?.some(item => pathname === item.href));
            
            // Filter dropdown items based on user permissions
            const filteredDropdown = link.dropdown?.filter(item => {
              if (item.requireAdmin) return isAdmin;
              if (item.requireAuth) return user;
              return true;
            });

            return (
              <div key={link.label} className="space-y-2">
                <Link
                  href={link.href}
                  className={cn(
                    "text-lg font-medium transition-colors hover:text-primary block",
                    isCurrentPath ? "text-primary" : ""
                  )}
                >
                  {link.label}
                </Link>
                {filteredDropdown && filteredDropdown.length > 0 && (
                  <div className="ml-4 space-y-2">
                    {filteredDropdown.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary block",
                          pathname === item.href ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {item.label === 'AI Chat (Voice + Text)' ? (
                          <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            {item.label}
                          </span>
                        ) : (
                          item.label
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm flex-shrink-0">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            // Hide entire Admin section for non-admin users
            if (link.requireAdmin && !isAdmin) return null;

            const isCurrentPath = pathname === link.href || 
              (link.dropdown?.some(item => pathname === item.href));
            
            // Filter dropdown items based on user permissions
            const filteredDropdown = link.dropdown?.filter(item => {
              if (item.requireAdmin) return isAdmin;
              if (item.requireAuth) return user;
              return true;
            });

            if (filteredDropdown && filteredDropdown.length > 0) {
              return (
                <DropdownMenu key={link.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary h-auto px-3 py-2",
                        isCurrentPath ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {filteredDropdown.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "w-full cursor-pointer",
                            pathname === item.href && "bg-accent"
                          )}
                        >
                          {item.label === 'AI Chat (Voice + Text)' ? (
                            <span className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              {item.label}
                            </span>
                          ) : (
                            item.label
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md",
                  isCurrentPath ? "text-primary bg-accent" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        
         <div className="flex items-center gap-2" suppressHydrationWarning>
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="w-20 h-9 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <>
                  {user ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
                                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                                    <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/account')}>
                                Account
                            </DropdownMenuItem>
                            {isAdmin && (
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  ) : (
                    <>
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Login</Link>
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
                  <MobileNavContent />
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;