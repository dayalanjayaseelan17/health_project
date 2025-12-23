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
import { User, Calendar, Ruler, Weight, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc } from "firebase/firestore";

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

const SignInForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Redirecting you to the symptoms checker...",
      });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "Incorrect email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="absolute top-0 left-0 h-full w-1/2 flex items-center justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center h-full px-12 text-center w-full">
          <h1 className="text-2xl font-bold text-primary mb-4">Sign In</h1>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full mb-2">
                <FormControl>
                  <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="Email" className="pl-9 bg-gray-100 border-none h-10" {...field} />
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
              <FormItem className="w-full mb-2">
                <FormControl>
                <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" className="pl-9 bg-gray-100 border-none h-10" {...field} />
                  </div>
                  </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <a href="#" className="text-sm text-muted-foreground hover:text-primary mb-4">
              Forgot your password?
            </a>
          <Button type="submit" className="w-40 rounded-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

const SignUpForm = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
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
        toast({
          title: "Account Created",
          description: "Redirecting you to the symptoms checker...",
        });
        onAuthSuccess();
      }
    } catch (error: any) {
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
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="absolute top-0 left-0 h-full w-1/2 flex items-center justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center h-full px-12 text-center w-full">
            <h1 className="text-2xl font-bold text-primary mb-4">Create Account</h1>
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="w-full mb-2">
                    <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Username" className="pl-9 bg-gray-100 border-none h-10" {...field} />
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
                <FormItem className="w-full mb-2">
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="Email" className="pl-9 bg-gray-100 border-none h-10" {...field} />
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
                <FormItem className="w-full mb-2">
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" className="pl-9 bg-gray-100 border-none h-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 w-full mb-2">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormControl>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="Age"
                            className="pl-9 bg-gray-100 border-none h-10"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                    </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormControl>
                    <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="Height (cm)"
                            className="pl-9 bg-gray-100 border-none h-10"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
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
                    <FormItem className="flex-1">
                    <FormControl>
                    <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="Weight (kg)"
                            className="pl-9 bg-gray-100 border-none h-10"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                    </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
            </div>
          <Button type="submit" className="w-40 rounded-full mt-4" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
};


export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.replace("/symptoms");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4 font-body">
      <div 
        id="container-main"
        className={`relative overflow-hidden rounded-2xl shadow-2xl bg-white w-full max-w-4xl min-h-[520px] 
                    ${isRightPanelActive ? 'right-panel-active' : ''}`}
      >
        {/* Sign Up Container */}
        <div className="form-container sign-up-container">
          <SignUpForm onAuthSuccess={handleAuthSuccess} />
        </div>

        {/* Sign In Container */}
        <div className="form-container sign-in-container">
          <SignInForm onAuthSuccess={handleAuthSuccess} />
        </div>
        
        {/* Overlay Container */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Overlay Left */}
            <div className="overlay-panel overlay-left">
                <h1 className="text-2xl font-bold">Welcome Back!</h1>
                <p className="text-sm mt-2 mb-4">To keep connected with us please login with your personal info</p>
                <Button variant="outline" className="bg-transparent border-white text-white rounded-full w-40" onClick={() => setIsRightPanelActive(false)}>Sign In</Button>
            </div>

            {/* Overlay Right */}
            <div className="overlay-panel overlay-right">
                <h1 className="text-2xl font-bold">Hello, Friend!</h1>
                <p className="text-sm mt-2 mb-4">Enter your personal details and start your journey with us</p>
                <Button variant="outline" className="bg-transparent border-white text-white rounded-full w-40" onClick={() => setIsRightPanelActive(true)}>Sign Up</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
