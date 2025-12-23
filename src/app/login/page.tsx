
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  User,
  Calendar,
  Ruler,
  Weight,
  Mail,
  Lock,
  LoaderCircle,
} from "lucide-react";
import {
  useAuth,
  useFirestore,
  setDocumentNonBlocking,
  useUser,
} from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

/* ---------------- SCHEMAS ---------------- */

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  age: z.coerce.number().min(1).max(120),
  height: z.coerce.number().min(50, { message: "Height in cm" }),
  weight: z.coerce.number().min(10, { message: "Weight in kg" }),
});

const signInSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

/* ---------------- SIGN IN ---------------- */

const SignInForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    try {
      // 1. Find user by username to get their email
      const usersRef = collection(firestore!, "users");
      const q = query(
        usersRef,
        where("username", "==", values.username),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Username not found");
      }

      const userDoc = querySnapshot.docs[0];
      const userEmail = userDoc.data().email;

      // 2. Sign in with the retrieved email and provided password
      await signInWithEmailAndPassword(auth, userEmail, values.password);

      toast({ title: "Login successful" });
      onAuthSuccess();
    } catch (e: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (e.message === "Username not found") {
        description = "No account found with this username.";
      } else if (e.code === "auth/wrong-password") {
        description = "Incorrect password. Please try again.";
      } else if (e.code === "auth/user-not-found") {
        description =
          "No account found associated with this username's email.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-in-container">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col justify-center px-12 space-y-4"
        >
          <h1 className="text-3xl font-bold">Sign In</h1>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Username"
                      {...field}
                      className="pl-10"
                    />
                  </div>
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
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Password"
                      {...field}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <a href="#" className="text-sm text-gray-500 hover:underline">
            Forgot your password?
          </a>
          <Button className="mt-4" disabled={loading}>
            {loading && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
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
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);

    try {
      // 1. Check if username is unique
      const usersRef = collection(firestore!, "users");
      const q = query(
        usersRef,
        where("username", "==", values.username),
        limit(1)
      );
      const usernameSnap = await getDocs(q);
      if (!usernameSnap.empty) {
        throw new Error("Username already taken, please choose another");
      }

      // 2. Create user with email and password
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 3. Save user profile data to Firestore
      const userProfile = {
        id: cred.user.uid,
        username: values.username,
        email: values.email, // Ensure email is saved
        age: values.age,
        height: values.height,
        weight: values.weight,
      };

      setDocumentNonBlocking(
        doc(firestore!, `users/${cred.user.uid}`),
        userProfile,
        { merge: true }
      );

      toast({ title: "Account created successfully!" });
      onAuthSuccess();
    } catch (e: any) {
      let description = "An unexpected error occurred.";
      if (e.message === "Username already taken, please choose another") {
        description = e.message;
      } else if (e.code === "auth/email-already-in-use") {
        description = "This email is already registered. Please sign in.";
      }
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col justify-center px-12 space-y-2"
        >
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Username"
                      {...field}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Email" {...field} className="pl-10" />
                  </div>
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
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Password"
                      {...field}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-2">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Age"
                        {...field}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Height (cm)"
                          {...field}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Weight (kg)"
                          {...field}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button className="mt-4" disabled={loading}>
            {loading && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign Up
          </Button>
        </form>
      </Form>
    </div>
  );
};

/* ---------------- PAGE ---------------- */

export default function LoginPage() {
  const [rightPanel, setRightPanel] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  // If user is already logged in, redirect them away from the login page
  useEffect(() => {
    if (isClient && !isUserLoading && user) {
      router.replace("/symptoms");
    }
  }, [user, isUserLoading, router, isClient]);

  const handleAuthSuccess = () => {
    router.replace("/symptoms");
  };

  // While checking user auth state, show a loader
  if (!isClient || isUserLoading || (isClient && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div
        className={`container-main ${rightPanel ? "right-panel-active" : ""}`}
      >
        <SignUpForm onAuthSuccess={handleAuthSuccess} />
        <SignInForm onAuthSuccess={handleAuthSuccess} />

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-4xl font-bold">Welcome Back!</h1>
              <p className="mt-4 text-center">
                Your health is your greatest wealth. Sign in to continue your wellness journey with us.
              </p>
              <Button
                variant="outline"
                className="mt-6 bg-transparent border-white text-white hover:bg-white/20"
                onClick={() => setRightPanel(false)}
              >
                Sign In
              </Button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-4xl font-bold">New to our Community?</h1>
              <p className="mt-4 text-center">
                Join us today! Create an account to get personalized health insights and take the first step towards a healthier you.
              </p>
              <Button
                variant="outline"
                className="mt-6 bg-transparent border-white text-white hover:bg-white/20"
                onClick={() => setRightPanel(true)}
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
