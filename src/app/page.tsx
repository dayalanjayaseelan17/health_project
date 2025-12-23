"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { HeartPulse, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FeatureCard = ({
  icon,
  title,
  description,
  buttonText,
  onClick,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isLoading: boolean;
}) => (
  <div className="flex flex-col items-center justify-between rounded-xl bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
    <div className="mb-4">{icon}</div>
    <h2 className="mb-2 text-2xl font-bold text-primary">{title}</h2>
    <p className="mb-6 text-muted-foreground">{description}</p>
    <Button
      size="lg"
      onClick={onClick}
      disabled={isLoading}
      className="w-full rounded-full"
    >
      {isLoading ? "Please wait..." : buttonText}
    </Button>
  </div>
);

export default function Home() {
  const [loading, setLoading] = useState<"quick" | "secure" | null>(null);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleQuickCheck = async () => {
    setLoading("quick");
    try {
      // Non-blocking call. The onAuthStateChanged listener in the provider will handle the redirect.
      initiateAnonymousSignIn(auth);
      toast({
        title: "Starting Anonymous Session",
        description: "Redirecting to the health checker...",
      });
      // The redirection will be handled by the auth state listener on the symptoms page
      router.push("/symptoms");
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      toast({
        variant: "destructive",
        title: "Anonymous Sign-In Failed",
        description: "Could not start a quick check session. Please try again.",
      });
      setLoading(null);
    }
  };

  const handleSecureLogin = () => {
    setLoading("secure");
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4 font-body">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary md:text-5xl">
          Swasthya Margdarshan
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Your simple guide to better health. Choose an option to get started.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <FeatureCard
          icon={<HeartPulse className="h-12 w-12 text-green-500" />}
          title="Quick Health Check"
          description="Check your health condition instantly without creating an account."
          buttonText="Start Quick Check"
          onClick={handleQuickCheck}
          isLoading={loading === "quick"}
        />
        <FeatureCard
          icon={<User className="h-12 w-12 text-blue-500" />}
          title="Secure Login"
          description="Sign in to save your health data and get detailed tracking."
          buttonText="Login or Sign Up"
          onClick={handleSecureLogin}
          isLoading={loading === "secure"}
        />
      </div>
    </main>
  );
}
