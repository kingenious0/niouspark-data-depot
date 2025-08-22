"use client";

import { auth, db } from "./firebase";
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface AppUser extends User {
    role?: 'admin' | 'customer';
}

const setAuthCookies = async (user: User | null) => {
    if (user) {
        const token = await user.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: token }),
        });
    } else {
        await fetch('/api/auth/session', { method: 'DELETE' });
    }
}

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        await setAuthCookies(user);
        const tokenResult = await user.getIdTokenResult(true); // Force refresh
        const userRole = (tokenResult.claims.role as 'admin' | 'customer') || 'customer';
        
        setUser({ ...user, role: userRole });
        setIsAdmin(userRole === 'admin');
      } else {
        await setAuthCookies(null);
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
}

export const login = async (email: string, password: string): Promise<{ user: User, role: string }> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const tokenResult = await userCredential.user.getIdTokenResult(true); // Force refresh
  const role = (tokenResult.claims.role as string) || 'customer';
  return { user: userCredential.user, role };
}

export const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
        await updateProfile(user, { displayName: name });
        // Set default role in Firestore, which will be picked up by the custom claims trigger.
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            displayName: name,
            role: "customer"
        });
        await user.getIdToken(true); // Force refresh of token
    }
    return userCredential;
}

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const additionalUserInfo = getAdditionalUserInfo(result);

    // If it's a new user, create their document in Firestore
    if (additionalUserInfo?.isNewUser && user) {
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            displayName: user.displayName,
            role: "customer",
            createdAt: new Date(),
        });
         await user.getIdToken(true);
    }
    const tokenResult = await user.getIdTokenResult(true);
    const role = tokenResult.claims.role || 'customer';
    return { user, role };
};


export const logout = async () => {
  await signOut(auth);
}

export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
}

export const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    const user = auth.currentUser;
    if (user) {
        await updateProfile(user, data);
        if (data.displayName) {
             await setDoc(doc(db, "users", user.uid), { displayName: data.displayName }, { merge: true });
        }
        await user.getIdToken(true);
    } else {
        throw new Error("No user is signed in to update.");
    }
};