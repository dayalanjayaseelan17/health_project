"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Calendar, Ruler, Weight, Mail, Lock } from "lucide-react";
import "./login.css";

const SignInForm = () => (
  <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center">
    <h1 className="text-3xl font-bold text-primary mb-4">Sign In</h1>
    <div className="relative w-full mb-4">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="email" placeholder="Email" className="pl-9" />
    </div>
    <div className="relative w-full mb-4">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="password" placeholder="Password" className="pl-9" />
    </div>
    <a href="#" className="text-sm text-muted-foreground hover:text-primary mb-4">
      Forgot your password?
    </a>
    <Button className="w-full">Sign In</Button>
  </div>
);

const SignUpForm = () => (
  <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center">
    <h1 className="text-3xl font-bold text-primary mb-4">Create Account</h1>
    <div className="relative w-full mb-3">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="text" placeholder="Username" className="pl-9" />
    </div>
    <div className="relative w-full mb-3">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="number" placeholder="Age" className="pl-9" />
    </div>
    <div className="relative w-full mb-3">
      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="number" placeholder="Height (cm)" className="pl-9" />
    </div>
    <div className="relative w-full mb-6">
      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="number" placeholder="Weight (kg)" className="pl-9" />
    </div>
    <Button className="w-full">Sign Up with Google</Button>
  </div>
);

export default function LoginPage() {
  const [isSignIn, setIsSignIn] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="container-main rounded-xl bg-card text-card-foreground shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[520px]">
        {/* Sign Up Form */}
        <div
          className={cn(
            "form-container sign-up-container",
            isSignIn && "opacity-0"
          )}
        >
          <SignUpForm />
        </div>

        {/* Sign In Form */}
        <div
          className={cn(
            "form-container sign-in-container",
            !isSignIn && "opacity-0"
          )}
        >
          <SignInForm />
        </div>

        {/* Overlay */}
        <div
          className={cn(
            "overlay-container",
            isSignIn && "translate-x-full"
          )}
        >
          <div
            className={cn(
              "overlay",
              isSignIn && "-translate-x-1/2"
            )}
          >
            {/* Left Overlay Panel */}
            <div className={cn("overlay-panel overlay-left", !isSignIn && "opacity-0")}>
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="mb-6">
                Login to continue tracking your health securely.
              </p>
              <Button variant="outline" onClick={() => setIsSignIn(false)}>
                Create Account
              </Button>
            </div>
            {/* Right Overlay Panel */}
            <div className={cn("overlay-panel overlay-right", isSignIn && "opacity-0")}>
              <h1 className="text-3xl font-bold mb-4">Get Your Health Checked</h1>
              <p className="mb-6">
                Check your health condition easily by logging in and storing your data securely in the cloud.
              </p>
              <Button variant="outline" onClick={() => setIsSignIn(true)}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
