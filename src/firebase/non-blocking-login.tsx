'use client';

import { Auth, signInAnonymously } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/**
 * Initiate anonymous sign-in (BLOCKING & SAFE).
 * This MUST be awaited by the caller.
 */
export async function initiateAnonymousSignIn(
  authInstance: Auth
): Promise<void> {
  try {
    await signInAnonymously(authInstance);
    console.log('✅ Anonymous sign-in successful');
  } catch (error: any) {
    console.error('🔥 Anonymous sign-in error:', error);

    toast({
      variant: 'destructive',
      title: 'Sign In Failed',
      description:
        error?.message ||
        'Could not sign in anonymously. Please check your connection.',
    });

    // 🔴 IMPORTANT: rethrow so caller knows it failed
    throw error;
  }
}

