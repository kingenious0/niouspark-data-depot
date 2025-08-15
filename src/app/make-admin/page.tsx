"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function MakeAdminPage() {
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) {
        toast({ title: "Please wait", description: "Authentication is still loading.", variant: 'destructive' });
        return;
    }
     if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to perform this action.", variant: 'destructive' });
        return;
    }
    setFormLoading(true);

    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
            throw new Error("Authentication token not found.");
        }
        
        // This API route has special logic to allow the first admin to be created.
        const response = await fetch('/api/auth/set-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ emailToMakeAdmin: email, newRole: 'admin' }),
        });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to make user admin.');
      }

      toast({
        title: "Success!",
        description: `${email} has been assigned the admin role. Please log out and log back in to see the changes.`,
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };
  
  if (authLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  // If user is already admin, redirect them away to prevent confusion.
  if (isAdmin) {
      redirect('/admin');
  }

  // If there's no user object even after loading, they must log in.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Assign First Admin</CardTitle>
          <CardDescription>
            Enter the email of the user you want to grant admin privileges to. 
            This action is protected and can only be performed if no other admins exist.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleMakeAdmin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">User's Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <Button className="w-full" type="submit" disabled={formLoading || authLoading}>
                {(formLoading || authLoading) && <Loader2 className="animate-spin mr-2" />}
                Make Admin
            </Button>
            </CardContent>
        </form>
      </Card>
    </div>
  );
}