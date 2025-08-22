"use client";

import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Logo from "@/components/logo";
import { useState } from "react";
import { login, sendPasswordReset, signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Wifi, Wand2, ArrowRight } from "lucide-react";
import { FirebaseError } from "firebase/app";
import Image from "next/image";

function ForgotPasswordDialog() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for instructions to reset your password.",
      });
      setDialogOpen(false);
    } catch (error: any) {
       let errorMessage = "An unexpected error occurred.";
       if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          errorMessage = "No user found with this email address.";
        } else {
          errorMessage = error.message;
        }
       }
      toast({
        title: "Failed to Send Reset Email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-primary hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reset-email" className="text-right">
              Email
            </Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2" />}
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { role } = await login(email, password);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push("/account");
      }

    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = "Invalid email or password. Please try again.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          default:
            errorMessage = error.message;
            break;
        }
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { role } = await signInWithGoogle();
      toast({
        title: "Sign-in Successful",
        description: "Welcome back!",
      });
       if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push("/account");
      }
    } catch (error: any) {
       toast({
        title: "Sign-in Failed",
        description: error.message || "An unexpected error occurred with Google Sign-in.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-full max-w-md border-none shadow-none">
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Logo />
              </div>
              <CardTitle className="font-headline text-3xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-6"
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <ForgotPasswordDialog />
                  </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-6"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full font-bold py-6" type="submit" disabled={loading || googleLoading}>
                {loading && <Loader2 className="animate-spin mr-2" />}
                Log In
              </Button>
               <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      OR
                    </span>
                  </div>
                </div>
                 <Button variant="outline" className="w-full py-6" type="button" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                  {googleLoading ? <Loader2 className="animate-spin mr-2" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.3 127.4c-24.3-23.8-59-39.7-99.3-39.7-83.8 0-151.8 68.2-151.8 152.1s68 152.1 151.8 152.1c94.9 0 131.3-64.4 136.8-98.2H248v-65.7h239.2c1.2 12.8 2 25.4 2 38.4z"></path></svg>}
                  Continue with Google
                </Button>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline font-semibold text-primary">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
       <div className="hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 lg:block relative">
         <div className="absolute inset-0 bg-black/40" />
         <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-10">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-4">Welcome to Niouspark</h2>
              <p className="text-xl opacity-90">Your all-in-one digital platform</p>
            </div>
            
            <div className="space-y-6 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 rounded-full p-3">
                    <Wifi className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Data Bundles</h3>
                    <p className="text-sm opacity-80">Affordable data for all networks</p>
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-60" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-500 rounded-full p-3">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">AI Paraphraser</h3>
                    <p className="text-sm opacity-80">Transform text with AI power</p>
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-60" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm opacity-75">
                Join thousands of satisfied customers
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}