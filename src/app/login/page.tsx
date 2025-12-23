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
import { useAuth, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

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
    <div className="absolute top-0 h-full left-0 w-1/2 transition-all duration-700 ease-in-out z-[2] group-[.right-panel-active]/container-main:translate-x-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full bg-card"
        >
          <h1 className="text-3xl font-bold text-primary mb-4">Sign In</h1>
          <div className="w-full max-w-sm space-y-4">
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
          </div>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-primary mt-4"
          >
            Forgot your password?
          </a>
          <Button type="submit" className="w-full max-w-sm mt-4">
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      if (user) {
        const userProfile = {
          id: user.uid,
          username: values.username,
          age: values.age,
          height: values.height,
          weight: values.weight,
        };
        const docRef = doc(firestore, `users/${user.uid}/profile/${user.uid}`);
        setDocumentNonBlocking(docRef, userProfile, { merge: true });
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
    <div className="absolute top-0 h-full left-0 w-1/2 opacity-0 z-[1] transition-all duration-700 ease-in-out group-[.right-panel-active]/container-main:opacity-100 group-[.right-panel-active]/container-main:translate-x-full group-[.right-panel-active]/container-main:z-[5]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full bg-card"
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
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.isAnonymous) {
        // If an anonymous user lands here, sign them out of the temp session
        // so they can create a real account.
        signOut(auth);
      } else {
        toast({
          title: "Login Successful",
          description: "Redirecting you to the symptoms checker...",
        });
        router.replace("/symptoms");
      }
    }
  }, [user, isUserLoading, router, toast, auth]);

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4 font-body">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg shadow-lg bg-white w-full max-w-4xl min-h-[520px] transition-all duration-700 ease-in-out group/container-main",
          isRightPanelActive && "right-panel-active"
        )}
        id="container-main"
      >
        <SignUpForm />
        <SignInForm />

        <div className="absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-[100] transition-transform duration-700 ease-in-out group-[.right-panel-active]/container-main:-translate-x-full">
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out group-[.right-panel-active]/container-main:translate-x-1/2">
            <div className="absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-in-out -translate-x-1/5 group-[.right-panel-active]/container-main:translate-x-0">
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="mb-6">
                Login to continue tracking your health securely.
              </p>
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
                type="button"
                onClick={() => setIsRightPanelActive(false)}
              >
                Sign In
              </Button>
            </div>

            <div className="absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-700 ease-in-out translate-x-0 group-[.right-panel-active]/container-main:translate-x-1/5">
              <h1 className="text-3xl font-bold mb-4">
                Get Your Health Checked
              </h1>
              <p className="mb-6">
                Check your health condition easily and store your data securely
                in the cloud.
              </p>
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
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
