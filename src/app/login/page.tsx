'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

import {
  User,
  Calendar,
  Ruler,
  Weight,
  Mail,
  Lock,
  LoaderCircle,
} from 'lucide-react';

import { useAuth, useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';

/* ---------------- SCHEMAS ---------------- */

const signUpSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.coerce.number().min(1).max(120),
  height: z.coerce.number().min(50),
  weight: z.coerce.number().min(10),
});

const signInSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/* ---------------- SIGN IN ---------------- */

const SignInForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Firebase not initialized.',
      });
      return;
    }

    setLoading(true);

    try {
      // 🔍 Get email using username
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('username', '==', values.username), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('USERNAME_NOT_FOUND');
      }

      const email = snap.docs[0].data().email;

      await signInWithEmailAndPassword(auth, email, values.password);

      toast({ title: 'Login successful' });
      onAuthSuccess();

    } catch (e: any) {
      console.error('🔥 SIGN IN ERROR:', e);

      let description = 'Something went wrong. Please try again.';

      if (e.message === 'USERNAME_NOT_FOUND') {
        description = 'Username does not exist.';
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        description = 'Incorrect password.';
      } else if (e.code === 'auth/unauthorized-domain') {
        description = 'This domain is not authorized in Firebase.';
      } else if (e.code === 'permission-denied') {
        description = 'Firestore permission denied.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-in-container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col justify-center space-y-4 px-12">
          <h1 className="text-3xl font-bold">Sign In</h1>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading}>
            {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  );
};

/* ---------------- SIGN UP ---------------- */

const SignUpForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    if (!auth || !firestore) return;

    setLoading(true);

    try {
      const q = query(
        collection(firestore, 'users'),
        where('username', '==', values.username),
        limit(1)
      );

      const snap = await getDocs(q);
      if (!snap.empty) throw new Error('USERNAME_TAKEN');

      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await setDocumentNonBlocking(
        doc(firestore, `users/${cred.user.uid}`),
        {
          id: cred.user.uid,
          username: values.username,
          email: values.email,
          age: values.age,
          height: values.height,
          weight: values.weight,
        },
        { merge: true }
      );

      toast({ title: 'Account created successfully' });
      onAuthSuccess();

    } catch (e: any) {
      console.error('🔥 SIGN UP ERROR:', e);

      let description = 'Could not create account.';

      if (e.message === 'USERNAME_TAKEN') {
        description = 'Username already exists.';
      } else if (e.code === 'auth/email-already-in-use') {
        description = 'Email already registered.';
      }

      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 px-12">
          <h1 className="text-3xl font-bold">Create Account</h1>

          <Input placeholder="Username" {...form.register('username')} />
          <Input placeholder="Email" {...form.register('email')} />
          <Input type="password" placeholder="Password" {...form.register('password')} />
          <Input type="number" placeholder="Age" {...form.register('age')} />
          <Input type="number" placeholder="Height (cm)" {...form.register('height')} />
          <Input type="number" placeholder="Weight (kg)" {...form.register('weight')} />

          <Button disabled={loading}>
            {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </form>
      </Form>
    </div>
  );
};

/* ---------------- PAGE ---------------- */

const LoginPageContent = () => {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  if (!isUserLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUpForm onAuthSuccess={() => router.replace('/dashboard')} />
      <SignInForm onAuthSuccess={() => router.replace('/dashboard')} />
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoaderCircle className="h-10 w-10 animate-spin" />}>
      <LoginPageContent />
    </Suspense>
  );
}
