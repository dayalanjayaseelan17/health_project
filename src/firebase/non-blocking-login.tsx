'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous sign-in error:", error);
    toast({
      variant: "destructive",
      title: "Sign In Failed",
      description: "Could not sign in anonymously. Please check your connection.",
    });
  });
}
