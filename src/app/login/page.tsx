"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, Ruler, Weight, Mail, Lock } from "lucide-react";
import { useAuth, useUser, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import "./login.css";

// Schemas for validation
const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.coerce.number().min(1, "Age is required").max(120),
  height: z.coerce.number().min(50, "Height is required"),
  weight: z.coerce.number().min(10, "Weight is required"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const SignInForm = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      console.error("Sign in error:", error.code);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "Incorrect email or password. Please try again.",
      });
    }
  }

  return (
    <div className="form-container sign-in-container">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full space-y-4"
        >
          <h1 className="text-3xl font-bold text-primary mb-4">Sign In</h1>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full max-w-sm">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      className="pl-9"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="w-full max-w-sm">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-9"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot your password?
          </a>
          <Button type="submit" className="w-full max-w-sm">
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  );
};

const SignUpForm = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      age: undefined,
      height: undefined,
      weight: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    try {
      // This is a special case; we need the user object to save profile data.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      if (user) {
        const userProfile = {
          id: user.uid, // Denormalized ID for security rules
          username: values.username,
          age: values.age,
          height: values.height,
          weight: values.weight,
        };
        const docRef = doc(firestore, `users/${user.uid}/profile/${user.uid}`);
        setDocumentNonBlocking(docRef, userProfile, { merge: true });
        // onAuthStateChanged will handle the redirect
      }
    } catch (error: any) {
      console.error("Sign up error:", error.code);
      if (error.code === "auth/email-already-in-use") {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: "This email is already registered. Please sign in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    }
  }

  return (
    <div className="form-container sign-up-container">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full"
        >
          <h1 className="text-3xl font-bold text-primary mb-4">
            Create Account
          </h1>
          <div className="w-full max-w-sm space-y-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="Username" className="pl-9" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email"
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Age"
                        className="pl-9"
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Height (cm)"
                        className="pl-9"
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Weight (kg)"
                        className="pl-9"
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full max-w-sm mt-6">
            Sign Up
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // If user is loaded and exists, redirect.
    if (!isUserLoading && user) {
      toast({
        title: "Login Successful",
        description: "Redirecting you to the symptoms checker...",
      });
      router.replace("/symptoms");
    }
  }, [user, isUserLoading, router, toast]);

  // Don't render the form until we know the user is not logged in
  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div
        className={cn(
          "container-main rounded-xl bg-card text-card-foreground shadow-2xl",
          isRightPanelActive && "right-panel-active"
        )}
      >
        <SignUpForm />
        <SignInForm />

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="mb-6">
                Login to continue tracking your health securely.
              </p>
              <Button
                variant="outline"
                className="ghost"
                type="button"
                onClick={() => setIsRightPanelActive(false)}
              >
                Sign In
              </Button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold mb-4">
                Get Your Health Checked
              </h1>
              <p className="mb-6">
                Check your health condition easily and store your data securely
                in the cloud.
              </p>
              <Button
                variant="outline"
                className="ghost"
                type="button"
                onClick={() => setIsRightPanelActive(true)}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
