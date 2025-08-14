
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
import { Loader2, PlusCircle, Trash2, UserPlus } from "lucide-react";
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

  return (
    <>
      <Card className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{bundle.name}</CardTitle>
          <CardDescription>{bundle.validity}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <p className="text-3xl font-bold">
            GH₵
            <span className="text-primary">
              {price.toFixed(2)}
            </span>
          </p>
          <p className="text-muted-foreground">{bundle.data}</p>
        </CardContent>
        <CardFooter>
            <Button className="w-full font-bold" onClick={handlePurchaseClick} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Purchase'}
            </Button>
        </CardFooter>
      </Card>
      
      <PurchaseDialog
        isOpen={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        bundle={{...bundle, price}}
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


  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (isOpen && user) {
        fetchSavedNumbers();
    }
  }, [user, isOpen]);

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
            if(data.numbers.length === 0) {
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
    if (!newNumberName || !newNumber) {
        toast({ title: "Error", description: "Please provide a name and number.", variant: "destructive" });
        return;
    }
    setIsAddingNumber(true);
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/user/saved-numbers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ name: newNumberName, number: newNumber }),
        });
        const data = await res.json();
        if(data.success) {
            toast({ title: "Success", description: "Number saved successfully."});
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
        if (!phone.match(/^\+233[0-9]{9}$/)) {
            toast({
                title: "Invalid Phone Number",
                description: "Please select or enter a valid Ghana phone number.",
                variant: "destructive",
            });
            return;
        }
        setShowConfirmDialog(true);
    } else {
        handlePurchase();
    }
  }

  const handlePurchase = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

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
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentChannel} onValueChange={setPaymentChannel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {paymentChannel === "mobile_money" && (
                <>
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    {loadingNumbers ? <Loader2 className="animate-spin" /> : (
                         <Select value={phone} onValueChange={setPhone}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a saved number" />
                            </SelectTrigger>
                            <SelectContent>
                                {savedNumbers.map(num => (
                                    <SelectItem key={num.number} value={num.number}>{num.name} - {num.number}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {showAddNumber ? (
                    <div className="space-y-3 p-3 border rounded-md">
                        <Label className="font-semibold">Add New Number</Label>
                         <Input
                            type="text"
                            placeholder="Name (e.g., Mom)"
                            value={newNumberName}
                            onChange={(e) => setNewNumberName(e.target.value)}
                        />
                         <Input
                            type="tel"
                            placeholder="+233..."
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddNumber} disabled={isAddingNumber} className="w-full">
                            {isAddingNumber && <Loader2 className="animate-spin mr-2"/>} Save
                          </Button>
                           <Button variant="ghost" onClick={() => setShowAddNumber(false)} className="w-full">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowAddNumber(true)}>
                        <UserPlus className="mr-2" /> Add a new number
                    </Button>
                )}
                </>
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
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePrimaryActionClick} type="button" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2" />}
              Pay GH₵{bundle.price.toFixed(2)}
            </Button>
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
