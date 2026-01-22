"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, AlertCircle, CheckCircle2, DollarSign, Package } from "lucide-react";
import { auth } from "@/lib/firebase";

interface Bundle {
    id: string;
    name: string;
    price: string;
    capacity: string;
    network: string;
    available?: boolean;
    customPrice?: string; // If returned by API explicitly
    customName?: string;
    mb: string;
}

interface NetworkBundles {
    mtn: Bundle[];
    telecel: Bundle[];
    at: Bundle[];
}

export default function BundleManagerPage() {
    const { user, loading: authLoading } = useAuth();
    const [bundles, setBundles] = useState<NetworkBundles | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchBundles = async () => {
        try {
            setLoading(true);
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) return;

            const res = await fetch('/api/admin/bundles', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            const data = await res.json();

            if (data.success) {
                setBundles(data.data);
            } else {
                throw new Error(data.error || 'Failed to fetch bundles');
            }
        } catch (error: any) {
            toast({
                title: "Error fetching bundles",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBundles();
        }
    }, [user]);

    const handleUpdate = async (bundle: Bundle, updates: { price?: string, available?: boolean, name?: string }) => {
        setSavingId(bundle.id);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin/bundles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    bundleId: bundle.id,
                    ...updates
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            // Optimistic update or refetch
            // Let's refetch to be safe/consistent with server logic (merging)
            // Or manually update state for speed
            if (bundles) {
                const networkKey = bundle.network === 'YELLO' ? 'mtn' : bundle.network === 'TELECEL' ? 'telecel' : 'at';
                // Simple re-fetch is easier to guarantee consistency with the merge logic
                await fetchBundles();
            }

            toast({
                title: "Bundle Updated",
                description: `Successfully updated ${bundle.name}`,
                variant: "default",
            });

        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSavingId(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const BundleList = ({ list }: { list: Bundle[] }) => {
        if (!list?.length) return <div className="p-8 text-center text-muted-foreground">No bundles found for this network.</div>;

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map(bundle => (
                    <BundleEditor key={bundle.id} bundle={bundle} onUpdate={handleUpdate} isSaving={savingId === bundle.id} />
                ))}
            </div>
        )
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Bundle Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage prices, availability, and details for all network bundles.
                    </p>
                </div>
                <Button onClick={fetchBundles} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            <Tabs defaultValue="mtn" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="mtn">MTN (Yellow)</TabsTrigger>
                    <TabsTrigger value="telecel">Telecel</TabsTrigger>
                    <TabsTrigger value="at">AirtelTigo</TabsTrigger>
                </TabsList>
                <div className="mt-6">
                    <TabsContent value="mtn" className="space-y-4">
                        <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>MTN Pricing</AlertTitle>
                            <AlertDescription>
                                Default system behaviors adds a +0.70 markup to underlying DataMart prices.
                                Setting a <strong>Custom Price</strong> here overrides that calculation completely.
                            </AlertDescription>
                        </Alert>
                        <BundleList list={bundles?.mtn || []} />
                    </TabsContent>
                    <TabsContent value="telecel" className="space-y-4">
                        <Alert className="bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-900">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Telecel Availability</AlertTitle>
                            <AlertDescription>
                                System default is set to <strong>Unavailable</strong> for all Telecel bundles.
                                Toggle "Available" below to enable specific bundles.
                            </AlertDescription>
                        </Alert>
                        <BundleList list={bundles?.telecel || []} />
                    </TabsContent>
                    <TabsContent value="at" className="space-y-4">
                        <BundleList list={bundles?.at || []} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function BundleEditor({ bundle, onUpdate, isSaving }: { bundle: Bundle, onUpdate: any, isSaving: boolean }) {
    const [price, setPrice] = useState(bundle.price);
    const [available, setAvailable] = useState(bundle.available !== false); // Default true unless explicitly false
    const [hasChanges, setHasChanges] = useState(false);

    // Sync state if bundle prop updates (e.g. after refresh)
    useEffect(() => {
        setPrice(bundle.price);
        setAvailable(bundle.available !== false);
        setHasChanges(false);
    }, [bundle]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(e.target.value);
        setHasChanges(true);
    };

    const handleAvailabilityChange = (checked: boolean) => {
        setAvailable(checked);
        setHasChanges(true);
        // Auto-save availability changes for better UX? 
        // Or wait for save button. Let's wait for save button to prevent accidental toggles going live instantly?
        // Actually, toggle switches usually imply instant action in modern UIs.
        // Let's do instant save for Toggle, manual save for Price.
        onUpdate(bundle, { available: checked, price }); // Pass current price too
    };

    const handleSave = () => {
        onUpdate(bundle, { price, available });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-medium">{bundle.name}</CardTitle>
                        <CardDescription>{bundle.capacity}GB / {bundle.mb}MB</CardDescription>
                    </div>
                    <Badge variant={available ? "outline" : "destructive"} className={available ? "text-green-600 border-green-200 bg-green-50" : ""}>
                        {available ? "Active" : "Disabled"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`price-${bundle.id}`}>Selling Price (GH₵)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id={`price-${bundle.id}`}
                            value={price}
                            onChange={handlePriceChange}
                            className="pl-9"
                            type="number"
                            step="0.01"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Original ID: {bundle.id}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label className="text-sm">Availability</Label>
                        <div className="text-xs text-muted-foreground">
                            Visible to customers
                        </div>
                    </div>
                    <Switch
                        checked={available}
                        onCheckedChange={handleAvailabilityChange}
                        disabled={isSaving}
                    />
                </div>

                {hasChanges && (
                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
