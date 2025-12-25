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

import { doc, setDoc } from 'firebase/firestore';

/* ---------------- SCHEMAS ---------------- */

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  age: z.coerce.number().min(1).max(120),
  height: z.coerce.number().min(50),
  weight: z.coerce.number().min(10),
});

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/* ---------------- SIGN IN (EMAIL BASED) ---------------- */

const SignInForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  console.log('🟢 SignInForm rendered');

  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    console.log('🟢 SignIn onSubmit', values.email);

    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Authentication service not ready.',
      });
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      toast({ title: 'Login successful' });
      onAuthSuccess();

    } catch (e: any) {
      console.error('🔥 LOGIN ERROR:', e);

      let description = 'Login failed. Please try again.';

      if (e.code === 'auth/user-not-found') {
        description = 'No account found with this email.';
      } else if (e.code === 'auth/wrong-password') {
        description = 'Incorrect password.';
      } else if (e.code === 'auth/invalid-credential') {
        description = 'Invalid email or password.';
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h1 className="text-3xl font-bold">Sign In</h1>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
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
    console.log('🟢 SignUp onSubmit', values.email);

    if (!auth || !firestore) {
      console.error('❌ Firebase not ready');
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await setDoc(
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

      let description = 'Signup failed. Please try again.';

      if (e.code === 'auth/email-already-in-use') {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h1 className="text-3xl font-bold">Create Account</h1>

        <Input placeholder="Username" {...form.register('username')} />
        <Input placeholder="Email" {...form.register('email')} />
        <Input type="password" placeholder="Password" {...form.register('password')} />
        <Input type="number" placeholder="Age" {...form.register('age')} />
        <Input type="number" placeholder="Height (cm)" {...form.register('height')} />
        <Input type="number" placeholder="Weight (kg)" {...form.register('weight')} />

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
