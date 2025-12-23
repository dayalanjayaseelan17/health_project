"use client";

import { useState } from "react";
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
  Loader2,
} from "lucide-react";
import {
  useAuth,
  useFirestore,
  setDocumentNonBlocking,
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
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);

    try {
      const usersRef = collection(firestore!, "users");
      const q = query(usersRef, where("username", "==", values.username), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("User not found");

      const email = snap.docs[0].data().email;
      await signInWithEmailAndPassword(auth, email, values.password);

      toast({ title: "Login successful" });
      onAuthSuccess();
    } catch {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid username or password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-in-container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col justify-center px-12">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>

          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button className="mt-4" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    setLoading(true);

    try {
      const usersRef = collection(firestore!, "users");
      const q = query(usersRef, where("username", "==", values.username));
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Username exists");

      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await setDocumentNonBlocking(
        doc(firestore!, `users/${cred.user.uid}`),
        { ...values, email: values.email },
        { merge: true }
      );

      toast({ title: "Account created" });
      onAuthSuccess();
    } catch {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: "Username or email already exists",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col justify-center px-12">
          <h2 className="text-2xl font-bold mb-4">Create Account</h2>

          {["username", "email", "password", "age", "height", "weight"].map((name) => (
            <FormField key={name} control={form.control} name={name as any} render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type={name === "password" ? "password" : "text"}
                    placeholder={name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          ))}

          <Button className="mt-4" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

  // ✅ FIXED: redirect ONLY if user is on login page
  const handleAuthSuccess = () => {
    if (window.location.pathname === "/login") {
      router.replace("/symptoms");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className={`container-main ${rightPanel ? "right-panel-active" : ""}`}>
        <SignUpForm onAuthSuccess={handleAuthSuccess} />
        <SignInForm onAuthSuccess={handleAuthSuccess} />

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2>Welcome Back!</h2>
              <Button onClick={() => setRightPanel(false)}>Sign In</Button>
            </div>
            <div className="overlay-panel overlay-right">
              <h2>Hello Friend!</h2>
              <Button onClick={() => setRightPanel(true)}>Sign Up</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// force fresh vercel build

