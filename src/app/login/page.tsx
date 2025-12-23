"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Calendar, Ruler, Weight, Mail, Lock } from "lucide-react";
import "./login.css";

const SignInForm = () => (
  <div className="form-container sign-in-container">
    <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full">
      <h1 className="text-3xl font-bold text-primary mb-4">Sign In</h1>
      <div className="relative w-full max-w-sm mb-4">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="email" placeholder="Email" className="pl-9" />
      </div>
      <div className="relative w-full max-w-sm mb-4">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="password" placeholder="Password" className="pl-9" />
      </div>
      <a href="#" className="text-sm text-muted-foreground hover:text-primary mb-4">
        Forgot your password?
      </a>
      <Button className="w-full max-w-sm">Sign In</Button>
    </div>
  </div>
);

const SignUpForm = () => (
  <div className="form-container sign-up-container">
    <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 text-center w-full">
      <h1 className="text-3xl font-bold text-primary mb-4">Create Account</h1>
      <div className="relative w-full max-w-sm mb-3">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="text" placeholder="Username" className="pl-9" />
      </div>
      <div className="relative w-full max-w-sm mb-3">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="email" placeholder="Email" className="pl-9" />
      </div>
       <div className="relative w-full max-w-sm mb-3">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="password" placeholder="Password" className="pl-9" />
      </div>
      <div className="relative w-full max-w-sm mb-3">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="number" placeholder="Age" className="pl-9" />
      </div>
      <div className="relative w-full max-w-sm mb-3">
        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="number" placeholder="Height (cm)" className="pl-9" />
      </div>
      <div className="relative w-full max-w-sm mb-6">
        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="number" placeholder="Weight (kg)" className="pl-9" />
      </div>
      <Button className="w-full max-w-sm">Sign Up</Button>
    </div>
  </div>
);

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

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
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                type="button"
                onClick={() => setIsRightPanelActive(false)}
              >
                Sign In
              </Button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold mb-4">Get Your Health Checked</h1>
              <p className="mb-6">
                Check your health condition easily and store your data securely in the cloud.
              </p>
              <Button
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
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
