"use client";

import { useAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
    return null;
  }
  
  if (!isAdmin) {
      redirect("/account");
      return null;
  }

  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}