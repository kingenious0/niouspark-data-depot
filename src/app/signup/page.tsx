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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Logo from "@/components/logo";
import { useState } from "react";
import { signup, signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FirebaseError } from "firebase/app";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      toast({
        title: "Signup Failed",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      await signup(name, email, password);
      toast({
        title: "Signup Successful",
        description: "Welcome! Your account has been created.",
      });
      router.push("/account");
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email is already registered. Please log in.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/weak-password':
            errorMessage = "The password is too weak. Please choose a stronger password.";
            break;
          default:
            errorMessage = error.message;
            break;
        }
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const { role } = await signInWithGoogle();
      toast({
        title: "Sign-in Successful",
        description: "Welcome!",
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
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join us to get the best data deals available.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleEmailSignup}>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold" type="submit" disabled={loading || googleLoading}>
                {loading && <Loader2 className="animate-spin mr-2" />}
                Create Account
            </Button>
        </CardFooter>
        </form>
        
        <div className="relative px-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                OR
                </span>
            </div>
        </div>

        <CardFooter className="flex flex-col gap-4 pt-6">
           <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading || googleLoading}>
              {googleLoading ? <Loader2 className="animate-spin mr-2" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.3 127.4c-24.3-23.8-59-39.7-99.3-39.7-83.8 0-151.8 68.2-151.8 152.1s68 152.1 151.8 152.1c94.9 0 131.3-64.4 136.8-98.2H248v-65.7h239.2c1.2 12.8 2 25.4 2 38.4z"></path></svg>}
              Continue with Google
            </Button>
        </CardFooter>

        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
            </Link>
        </div>
      </Card>
    </div>
  );
}