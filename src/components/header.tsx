"use client";

import React, { useState, useEffect } from "react";
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
    href: "/bundles",
    label: "Buy Data",
    dropdown: [
      { href: "/bundles/mtn", label: "MTN Data" },
      { href: "/bundles/telecel", label: "Telecel" },
      { href: "/bundles/airteltigo", label: "AirtelTigo" }
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
    href: "/",
    label: "More",
    dropdown: [
      { href: "/", label: "Home" },
      { href: "/chat", label: "AI Assistant" },
      { href: "/paraphraser", label: "Paraphraser" },
      { href: "/about", label: "Company Info" },
      { href: "/contact", label: "Contact Support" }
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

interface MobileNavProps {
  navLinks: NavLink[];
  user: any;
  isAdmin: boolean;
  pathname: string;
  onLogout: () => void;
  setOpen: (open: boolean) => void;
}

const MobileNav = ({ navLinks, user, isAdmin, pathname, onLogout, setOpen }: MobileNavProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Initialize with the section containing the current path open
  useEffect(() => {
    const activeSection = navLinks.find(link =>
      link.dropdown?.some(item => pathname === item.href) || link.href === pathname
    );
    if (activeSection) {
      setOpenSections(prev => ({ ...prev, [activeSection.label]: true }));
    }
  }, [pathname, navLinks]);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 pb-2 border-b">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <LogoIcon />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-6 scrollbar-hide">
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => {
            // Hide entire Admin section for non-admin users
            if (link.requireAdmin && !isAdmin) return null;

            const isCurrentPath = pathname === link.href ||
              (link.dropdown?.some(item => pathname === item.href));

            const isOpen = openSections[link.label];
            const hasDropdown = link.dropdown && link.dropdown.length > 0;

            // Filter dropdown items based on user permissions
            const filteredDropdown = link.dropdown?.filter(item => {
              if (item.requireAdmin) return isAdmin;
              if (item.requireAuth) return user;
              return true;
            });

            if (!filteredDropdown || filteredDropdown.length === 0) {
              return (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200",
                      isCurrentPath
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {link.label}
                  </Link>
                </div>
              );
            }

            return (
              <div key={link.label} className="space-y-1">
                <button
                  onClick={() => toggleSection(link.label)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 group select-none",
                    isCurrentPath && !isOpen
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span className={cn(isOpen && "text-primary")}>{link.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen ? "rotate-180 text-primary" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out overflow-hidden",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0">
                    <div className="ml-4 pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 my-1">
                      {filteredDropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            pathname === item.href
                              ? "bg-primary/5 text-primary"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          {item.href === '/chat' ? (
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
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-6 pt-4 mt-auto bg-background/95 backdrop-blur z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          {user ? (
            <Button variant="ghost" onClick={onLogout} className="justify-start px-4 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 font-medium">
              <LogOut className="mr-2 h-4 w-4 text-red-500" />
              Logout
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                          {item.href === '/chat' ? (
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
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <MobileNav
                  navLinks={navLinks}
                  user={user}
                  isAdmin={isAdmin}
                  pathname={pathname}
                  onLogout={handleLogout}
                  setOpen={setIsMobileMenuOpen}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;