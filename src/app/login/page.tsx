'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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

import { LoaderCircle } from 'lucide-react';

import { useAuth, useFirestore, useUser } from '@/firebase';

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
  setDoc,
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
  console.log('🟢 SignInForm rendered');

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    console.log('🟢 SignIn onSubmit called', values);

    if (!auth || !firestore) {
      console.error('❌ Firebase not ready');
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(firestore, 'users'),
        where('username', '==', values.username),
        limit(1)
      );

      const snap = await getDocs(q);

      if (snap.empty) throw new Error('USERNAME_NOT_FOUND');

      const email = snap.docs[0].data().email;

      await signInWithEmailAndPassword(auth, email, values.password);

      toast({ title: 'Login successful' });
      onAuthSuccess();
    } catch (e: any) {
      console.error('🔥 SIGN IN ERROR:', e);

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          e.message === 'USERNAME_NOT_FOUND'
            ? 'Username not found'
            : e.code === 'auth/wrong-password'
            ? 'Incorrect password'
            : 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" disabled={loading}>
          {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
};

/* ---------------- SIGN UP ---------------- */

const SignUpForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  console.log('🟢 SignUpForm rendered');

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    console.log('🟢 SignUp onSubmit called', values);

    if (!auth || !firestore) {
      console.error('❌ Firebase not ready');
      return;
    }

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

      await setDoc(
        doc(firestore, `users/${cred.user.uid}`),
        {
          id: cred.user.uid,
          ...values,
        },
        { merge: true }
      );

      toast({ title: 'Account created successfully' });
      onAuthSuccess();
    } catch (e: any) {
      console.error('🔥 SIGN UP ERROR:', e);

      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description:
          e.message === 'USERNAME_TAKEN'
            ? 'Username already exists'
            : 'Signup failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <Input placeholder="Username" {...form.register('username')} />
        <Input placeholder="Email" {...form.register('email')} />
        <Input type="password" placeholder="Password" {...form.register('password')} />
        <Input type="number" placeholder="Age" {...form.register('age')} />
        <Input type="number" placeholder="Height" {...form.register('height')} />
        <Input type="number" placeholder="Weight" {...form.register('weight')} />

        <Button type="submit" disabled={loading}>
          {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Sign Up
        </Button>
      </form>
    </Form>
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
    <div className="flex min-h-screen items-center justify-center gap-10">
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
