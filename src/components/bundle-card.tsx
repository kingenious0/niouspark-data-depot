"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, UserPlus, Wallet, CreditCard, AlertCircle, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth } from "@/lib/firebase";

interface Bundle {
  id: string;
  name: string;
  price: number;
  data: string;
  validity: string;
  available?: boolean;
  capacity?: string;
  network?: string;
}

interface BundleCardProps {
  bundle: Bundle;
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const price = typeof bundle.price === 'string' ? parseFloat(bundle.price) : bundle.price;

  const handlePurchaseClick = () => {
    // Don't allow purchase if bundle is unavailable
    if (bundle.available === false) {
      return;
    }

    if (!user) {
      router.push('/login');
    } else {
      setPurchaseDialogOpen(true);
    }
  };

  if (isNaN(price)) {
    return (
      <Card className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{bundle.name}</CardTitle>
          <CardDescription>{bundle.validity}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <p className="text-3xl font-bold text-destructive">
            Price Unavailable
          </p>
          <p className="text-muted-foreground">{bundle.data}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full font-bold" disabled>Purchase</Button>
        </CardFooter>
      </Card>
    )
  }

  // Check if bundle is unavailable
  const isUnavailable = bundle.available === false;

  return (
    <>
      <Card className={`flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300 ${isUnavailable ? 'opacity-75 border-muted' : ''}`}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{bundle.name}</CardTitle>
          <CardDescription>
            {bundle.validity}
            {isUnavailable && (
              <span className="block text-sm text-destructive font-medium mt-1">
                Currently Unavailable
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <p className="text-3xl font-bold">
            GH₵
            <span className={isUnavailable ? "text-muted-foreground" : "text-primary"}>
              {price.toFixed(2)}
            </span>
          </p>
          <p className="text-muted-foreground">{bundle.data}</p>
          {isUnavailable && (
            <p className="text-sm text-destructive">
              This bundle is temporarily not available for purchase.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full font-bold"
            onClick={handlePurchaseClick}
            disabled={loading || isUnavailable}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isUnavailable ? (
              'Unavailable'
            ) : (
              'Purchase'
            )}
          </Button>
        </CardFooter>
      </Card>

      <PurchaseDialog
        isOpen={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        bundle={{ ...bundle, price }}
      />
    </>
  );
}

interface SavedNumber {
  name: string;
  number: string;
}

interface PurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: Bundle;
}

function PurchaseDialog({ isOpen, onOpenChange, bundle }: PurchaseDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+233");
  const [paymentChannel, setPaymentChannel] = useState("card");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // State for saved numbers
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [newNumberName, setNewNumberName] = useState("");
  const [newNumber, setNewNumber] = useState("+233");
  const [isAddingNumber, setIsAddingNumber] = useState(false);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDatamartPurchase, setShowDatamartPurchase] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (isOpen && user) {
      fetchSavedNumbers();
      checkAdminStatus();
    }
  }, [user, isOpen]);

  const checkAdminStatus = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      console.log("🔍 Checking admin status for user:", user?.email);

      const decodedToken = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }).then(res => res.json());

      console.log("🔍 Token verification result:", decodedToken);

      if (decodedToken.success && decodedToken.data.role === 'admin') {
        console.log("✅ User is admin, enabling Datamart purchase");
        setIsAdmin(true);
        setShowDatamartPurchase(true);
      } else {
        console.log("❌ User is not admin, role:", decodedToken.data?.role);
        setIsAdmin(false);
        setShowDatamartPurchase(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
      setShowDatamartPurchase(false);
    }
  };

  const fetchSavedNumbers = async () => {
    setLoadingNumbers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/user/saved-numbers', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setSavedNumbers(data.numbers);
        if (data.numbers.length === 0) {
          setShowAddNumber(true); // If no numbers, show add form by default
        } else {
          setPhone(data.numbers[0].number); // Default to first saved number
        }
      }
    } catch (error) {
      console.error("Failed to fetch saved numbers:", error);
    } finally {
      setLoadingNumbers(false);
    }
  }

  const handleAddNumber = async () => {
    // For admin, we save the number in the main 'phone' input. For customers, they use the 'newNumber' input.
    const numberToSave = isAdmin ? phone : newNumber;

    if (!newNumberName || !numberToSave) {
      toast({ title: "Error", description: "Please provide a name and number.", variant: "destructive" });
      return;
    }
    setIsAddingNumber(true);
    try {
      const formattedNewNumber = cleanAndFormatGhanaPhoneNumber(numberToSave);
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/user/saved-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name: newNumberName, number: formattedNewNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Number saved successfully." });
        setSavedNumbers([...savedNumbers, data.number]);
        setPhone(data.number.number); // Select the newly added number
        setNewNumberName("");
        setNewNumber("+233");
        setShowAddNumber(false);
      } else {
        throw new Error(data.error || "Failed to save number.");
      }
    } catch (error: any) {
      toast({ title: "Error Saving Number", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingNumber(false);
    }
  }

  const handlePrimaryActionClick = () => {
    if (paymentChannel === "mobile_money") {
      try {
        const formattedPhone = cleanAndFormatGhanaPhoneNumber(phone);
        setPhone(formattedPhone);
      } catch (err: any) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid Ghana phone number (e.g. 0XXXXXXXXX or +233XXXXXXXXX).",
          variant: "destructive",
        });
        return;
      }
      setShowConfirmDialog(true);
    } else {
      handlePurchase();
    }
  }

  const handleDatamartPurchase = async () => {
    setLoading(true);

    // Double-check admin status before proceeding
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "This feature is only available for admin users.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = cleanAndFormatGhanaPhoneNumber(phone);
      setPhone(formattedPhone);
    } catch (err: any) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Ghana phone number (e.g. 0XXXXXXXXX or +233XXXXXXXXX).",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Extract capacity and network from bundle
      const capacity = bundle.capacity || bundle.name.match(/(\d+)GB/)?.[1] || "1";
      const network = bundle.network || "MTN"; // Default to MTN if not specified

      console.log("🔄 Admin Datamart purchase initiated:", {
        phoneNumber: phone,
        network: network,
        capacity: capacity,
        userId: user?.uid,
        email: email,
        bundleName: bundle.name,
      });

      const res = await fetch("/api/datamart-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          network: network,
          capacity: capacity,
          userId: user?.uid,
          email: email,
          bundleName: bundle.name,
        }),
      });

      const result = await res.json();
      console.log("🔄 Datamart purchase response:", result);

      if (result.success) {
        if (result.data.requiresPayment) {
          // This should NEVER happen for admin purchases - log error and prevent redirect
          console.error("❌ CRITICAL: Admin user was marked as requiring payment! This should not happen.");
          toast({
            title: "System Error",
            description: "Admin purchase incorrectly flagged for payment. Please contact support.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        } else {
          // Admin wallet purchase successful
          const balanceAfter = result.data.balanceAfter ?? result.data.remainingBalance;
          toast({
            title: "Purchase Successful! 🎉",
            description: `Bundle purchased for ${phone}. Datamart Balance: GH₵${balanceAfter}`,
          });

          onOpenChange(false);

          // Redirect to account page
          setTimeout(() => {
            window.location.href = '/account?purchase_success=true';
          }, 2000);
        }
      } else {
        if (result.error === "Insufficient wallet balance" || result.error === "Insufficient Datamart wallet balance") {
          toast({
            title: "Insufficient Datamart Wallet Balance",
            description: result.details || "Please top up your Datamart wallet to continue.",
            variant: "destructive",
          });
          setShowDatamartPurchase(false);
        } else {
          toast({
            title: "Purchase Failed",
            description: result.error || "Failed to complete purchase.",
            variant: "destructive",
          });
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error in Datamart purchase:", err);
      toast({
        title: "Server Error",
        description: "Could not process your purchase request.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    // Prevent admin users from using regular payment flow
    if (isAdmin) {
      toast({
        title: "Admin Access Required",
        description: "Admin users should use the Datamart wallet purchase option.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const finalPhone = paymentChannel === "mobile_money" ? phone : undefined;

    try {
      const res = await fetch("/api/charge-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: `NDD_${Date.now()}`,
          email,
          phone: finalPhone,
          bundleId: bundle.id,
          bundleName: bundle.name,
          amount: Math.round(bundle.price * 100),
          channel: paymentChannel,
          userId: user?.uid,
        }),
      });

      const result = await res.json();

      onOpenChange(false);

      if (result.success && result.data.authorization_url) {
        toast({
          title: "Redirecting to Paystack...",
          description: "Please complete your payment on the secure Paystack page.",
        });
        window.location.href = result.data.authorization_url;
      } else {
        toast({
          title: "Payment Error",
          description: result.error || "Failed to initiate payment.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("Error in charging:", err);
      toast({
        title: "Server Error",
        description: "Could not process your payment request.",
        variant: "destructive",
      });
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {user && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">
                Purchase {bundle.name}
              </DialogTitle>
              <DialogDescription>
                Confirm details to complete your purchase.
              </DialogDescription>
            </DialogHeader>

            {/* Admin Datamart Purchase Section */}
            {isAdmin && showDatamartPurchase && (
              <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-900/50">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Admin Wallet Purchase</h4>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed">
                      Funds will be deducted directly from your Datamart wallet balance. Instant processing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="py-2 space-y-4 w-full max-w-full overflow-hidden">
              {isAdmin ? (
                // PREMIUM ADMIN VIEW (REDESIGNED FOR ABSOLUTE RESPONSIVENESS)
                <div className="space-y-4 w-full max-w-full overflow-hidden">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                      Recipient Number
                    </Label>

                    {/* Clean & Premium Input Area */}
                    <div className="relative w-full">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                      <Input
                        className="w-full h-12 text-base font-bold font-mono tracking-wide pl-10 pr-10 shadow-sm transition-all rounded-xl focus-visible:ring-emerald-500/30 border-slate-200 dark:border-slate-800 focus:border-emerald-500 bg-background"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="020 000 0000"
                      />
                      {phone && phone !== "+233" && (
                        <button
                          type="button"
                          onClick={() => setPhone("+233")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Horizontal Contacts Carousel (Frictionless Quick Pick) */}
                    {savedNumbers.length > 0 && (
                      <div className="space-y-1.5 w-full overflow-hidden">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                          Quick Pick Contacts
                        </span>
                        <div className="w-full min-w-0 overflow-hidden">
                          <div className="flex gap-1.5 overflow-x-auto pb-2 scroll-smooth -mx-1 px-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {savedNumbers.map(num => {
                              const isSelected = phone === num.number || 
                                (phone.replace(/\D/g, '') === num.number.replace(/\D/g, '')) ||
                                (phone.replace(/^(\+233|233|0)/, '') === num.number.replace(/^(\+233|233|0)/, ''));
                              
                              return (
                                <button
                                  key={num.number}
                                  type="button"
                                  onClick={() => setPhone(num.number)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap active:scale-95 ${
                                    isSelected
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400'
                                      : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span className="max-w-[100px] truncate">{num.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Utility Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900">
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => setPhone(user?.phoneNumber || "+233")}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Use My Number
                      </button>

                      <button
                        type="button"
                        className={`text-xs font-semibold transition-colors flex items-center gap-1.5 py-1 px-1.5 rounded-md ${
                          showAddNumber
                            ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                            : 'text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                        onClick={() => setShowAddNumber(!showAddNumber)}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {showAddNumber ? 'Cancel' : 'Save as Contact'}
                      </button>
                    </div>
                  </div>

                  {/* Add Number Form (Sleek Drawer-like Panel) */}
                  {showAddNumber && (
                    <div className="p-3 border border-emerald-100 dark:border-emerald-950/30 rounded-xl bg-gradient-to-r from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/5 dark:to-teal-950/5 animate-in fade-in slide-in-from-top-3 duration-250">
                      <Label className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-bold block mb-1.5">
                        Save "{phone}" as Contact
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1 h-9 text-xs rounded-lg border-emerald-200/50 dark:border-emerald-900/30 focus-visible:ring-emerald-500/20 bg-background"
                          placeholder="Contact Name (e.g. Mary Lil Sis)"
                          value={newNumberName}
                          onChange={(e) => setNewNumberName(e.target.value)}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleAddNumber} 
                          disabled={isAddingNumber || !newNumberName.trim()}
                          className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all active:scale-95 shadow-sm"
                        >
                          {isAddingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Customer View: Standard Payment Flow
                <div className="space-y-4 w-full max-w-full overflow-hidden">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Payment Method</Label>
                    <Select value={paymentChannel} onValueChange={setPaymentChannel}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentChannel === "mobile_money" && (
                    <div className="space-y-4 pt-1 w-full overflow-hidden">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                          Mobile Money Recipient Number
                        </Label>
                        
                        {/* Clean & Premium Input Area */}
                        <div className="relative w-full">
                          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                          <Input
                            className="w-full h-12 text-base font-bold font-mono tracking-wide pl-10 pr-10 shadow-sm transition-all rounded-xl focus-visible:ring-emerald-500/30 border-slate-200 dark:border-slate-800 focus:border-emerald-500 bg-background"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="020 000 0000"
                          />
                          {phone && phone !== "+233" && (
                            <button
                              type="button"
                              onClick={() => setPhone("+233")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Saved Contacts Carousel (Frictionless Autofill) */}
                        {savedNumbers.length > 0 && (
                          <div className="space-y-1.5 w-full overflow-hidden">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                              Quick Pick Contacts
                            </span>
                            <div className="w-full min-w-0 overflow-hidden">
                              <div className="flex gap-1.5 overflow-x-auto pb-2 scroll-smooth -mx-1 px-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {savedNumbers.map(num => {
                                  const isSelected = phone === num.number || 
                                    (phone.replace(/\D/g, '') === num.number.replace(/\D/g, '')) ||
                                    (phone.replace(/^(\+233|233|0)/, '') === num.number.replace(/^(\+233|233|0)/, ''));
                                  
                                  return (
                                    <button
                                      key={num.number}
                                      type="button"
                                      onClick={() => setPhone(num.number)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap active:scale-95 ${
                                        isSelected
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400'
                                          : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                      }`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                      <span className="max-w-[100px] truncate">{num.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Utility Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900">
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                            onClick={() => setPhone(user?.phoneNumber || "+233")}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Use My Number
                          </button>

                          <button
                            type="button"
                            className={`text-xs font-semibold transition-colors flex items-center gap-1.5 py-1 px-1.5 rounded-md ${
                              showAddNumber
                                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                                : 'text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                            onClick={() => setShowAddNumber(!showAddNumber)}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {showAddNumber ? 'Cancel' : 'Save as Contact'}
                          </button>
                        </div>
                      </div>

                      {/* Add Number Form (Sleek Drawer-like Panel) */}
                      {showAddNumber && (
                        <div className="p-3 border border-emerald-100 dark:border-emerald-950/30 rounded-xl bg-gradient-to-r from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/5 dark:to-teal-950/5 animate-in fade-in slide-in-from-top-3 duration-250">
                          <Label className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-bold block mb-1.5">
                            Save "{phone}" as Contact
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              className="flex-1 h-9 text-xs rounded-lg border-emerald-200/50 dark:border-emerald-900/30 focus-visible:ring-emerald-500/20 bg-background"
                              placeholder="Contact Name (e.g. Mom)"
                              value={newNumberName}
                              onChange={(e) => setNewNumberName(e.target.value)}
                            />
                            <Button 
                              size="sm" 
                              onClick={handleAddNumber} 
                              disabled={isAddingNumber || !newNumberName.trim()}
                              className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all active:scale-95 shadow-sm"
                            >
                              {isAddingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2">


              {/* Admin Datamart Purchase Button */}
              {isAdmin && showDatamartPurchase && (
                <Button
                  onClick={handleDatamartPurchase}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all text-white font-semibold h-11"
                >
                  {loading && <Loader2 className="animate-spin mr-2" />}
                  <Wallet className="mr-2 h-4 w-4" />
                  Purchase with Wallet (GH₵{bundle.price.toFixed(2)})
                </Button>
              )}

              {/* Regular Payment Button - ONLY for customers */}
              {!isAdmin && (
                <Button onClick={handlePrimaryActionClick} type="button" disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with {paymentChannel === "mobile_money" ? "Mobile Money" : "Card"} (GH₵{bundle.price.toFixed(2)})
                </Button>
              )}

              {/* Admin-only message when Datamart purchase is not available */}
              {isAdmin && !showDatamartPurchase && (
                <div className="w-full p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin Wallet Purchase Unavailable</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Datamart wallet purchase is currently unavailable. Please contact support.
                  </p>
                </div>
              )}

              <DialogClose asChild>
                <Button variant="outline" className="w-full">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to purchase a bundle for the number{" "}
              <span className="font-bold text-primary">{phone}</span>.
              <br />
              Please confirm this is the correct number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Change Number</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchase}>Confirm & Pay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper to clean and format Ghana phone numbers to +233XXXXXXXXX format
function cleanAndFormatGhanaPhoneNumber(phone: string): string {
  // Remove all whitespace and common punctuation
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // Get digits only
  let digits = clean.replace(/\D/g, '');
  
  // Normalize digits to 233XXXXXXXXX
  if (digits.startsWith('2330') && digits.length === 13) {
    digits = '233' + digits.substring(4); // Remove the extra '0' after '233'
  } else if (digits.startsWith('233') && digits.length === 12) {
    // Correct format digits (233 + 9 digits)
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = '233' + digits.substring(1); // Convert 0XXXXXXXXX to 233XXXXXXXXX
  } else if (digits.length === 9) {
    digits = '233' + digits; // Convert XXXXXXXXX to 233XXXXXXXXX
  } else if (digits.startsWith('233') && digits.length === 13 && digits[3] === '0') {
    digits = '233' + digits.substring(4); // Remove '0' if user did 2330XXXXXXXXX
  }
  
  // Validate that we have exactly +233 followed by 9 digits
  if (/^233[0-9]{9}$/.test(digits)) {
    return '+' + digits;
  }
  
  throw new Error("Invalid Ghana phone number format.");
}