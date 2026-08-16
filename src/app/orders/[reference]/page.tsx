"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Smartphone, Network, HardDrive, CreditCard } from "lucide-react";
import { isTerminalDatamartStatus } from "@/lib/datamart-util";

interface OrderStatusData {
  reference: string;
  status: string;
  source: "webhook" | "api" | "local";
  orderStatus: string;
  updatedAt?: string | null;
  phoneNumber?: string | null;
  network?: string | null;
  capacity?: string | null;
  bundleName?: string | null;
  price?: number | null;
  processingMethod?: string | null;
}

const TIMELINE = ["pending", "waiting", "processing", "completed"] as const;

function statusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "waiting": return "Waiting";
    case "processing": return "Processing";
    case "completed": return "Completed";
    case "failed": return "Failed";
    case "refunded": return "Refunded";
    default: return status.replace("_", " ");
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "completed": return "default" as const;
    case "failed":
    case "refunded": return "destructive" as const;
    case "pending":
    case "waiting":
    case "processing": return "secondary" as const;
    default: return "outline" as const;
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function OrderTrackingPage() {
  const params = useParams<{ reference: string }>();
  const reference = params?.reference ?? "";
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<OrderStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (idToken: string) => {
    const response = await fetch(`/api/orders/${encodeURIComponent(reference)}/status`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    let result: { success?: boolean; error?: string; data?: OrderStatusData };
    try {
      result = await response.json();
    } catch {
      setError(`Server error (${response.status}). Please try again.`);
      setData(null);
      return;
    }
    if (!response.ok) {
      setError(result.error || `Failed to load order status (${response.status}).`);
      setData(null);
      return;
    }
    setData(result.data || null);
    setError(null);
  }, [reference]);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const idToken = await user.getIdToken();
      await fetchStatus(idToken);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user, fetchStatus]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("You must be signed in to view your order.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        if (cancelled) return;
        await fetchStatus(idToken);
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, fetchStatus]);

  if (authLoading || (loading && !data && !error)) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-lg">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              {user && (
                <Button onClick={() => { setLoading(true); load(); }} disabled={refreshing}>
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Try again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const status = data.status;
  const terminal = isTerminalDatamartStatus(status);
  const timelineIndex = terminal && status !== "completed"
    ? -1
    : Math.max(0, TIMELINE.indexOf(status as any));

  return (
    <div className="container mx-auto py-10 px-4 max-w-lg">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Order Status</CardTitle>
              <CardDescription className="mt-1">
                Reference #{data.reference.slice(0, 7)}...
              </CardDescription>
            </div>
            <Badge variant={statusVariant(status)} className="capitalize">
              {statusLabel(status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order details */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Phone</span>
              <span className="ml-auto font-medium">{data.phoneNumber || "—"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Network className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Network</span>
              <span className="ml-auto font-medium">{data.network || "—"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Bundle</span>
              <span className="ml-auto font-medium">{data.bundleName || data.capacity || "—"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Amount</span>
              <span className="ml-auto font-medium">
                {data.price != null ? `GH₵${data.price.toFixed(2)}` : "—"}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {status === "completed" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="font-semibold">Data delivered</p>
              <p className="text-sm text-muted-foreground">
                Your {data.bundleName || data.capacity || "data bundle"} has been delivered.
              </p>
            </div>
          ) : status === "failed" || status === "refunded" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="font-semibold">{statusLabel(status)}</p>
              <p className="text-sm text-muted-foreground">
                {status === "refunded"
                  ? "Your payment was refunded."
                  : "We could not complete the delivery. Please contact support."}
              </p>
            </div>
          ) : (
            <ol className="space-y-0">
              {TIMELINE.map((step, i) => {
                const reached = i <= timelineIndex;
                const current = i === timelineIndex;
                return (
                  <li key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                          reached
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 text-muted-foreground/50"
                        }`}
                      >
                        {reached && !current ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      {i < TIMELINE.length - 1 && (
                        <span
                          className={`w-0.5 flex-1 min-h-6 ${reached ? "bg-primary" : "bg-muted-foreground/20"}`}
                        />
                      )}
                    </div>
                    <span
                      className={`pb-4 text-sm ${
                        reached ? "font-medium" : "text-muted-foreground/60"
                      }`}
                    >
                      {statusLabel(step)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Last updated</span>
              <span>{formatDate(data.updatedAt)}</span>
            </div>
            {data.processingMethod && (
              <div className="flex justify-between mt-1">
                <span>Processing method</span>
                <span className="capitalize">{data.processingMethod.replace("_", " ")}</span>
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span>Source</span>
              <span className="capitalize">{data.source}</span>
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => load()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
