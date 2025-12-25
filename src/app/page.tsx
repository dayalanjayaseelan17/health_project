'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';

import { HeartPulse, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-between rounded-xl bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
      <div className="mb-4">{icon}</div>
      <h2 className="mb-2 text-2xl font-bold text-primary">{title}</h2>
      <p className="mb-6 flex-grow text-muted-foreground">{description}</p>
      <Button onClick={onClick} disabled={isLoading} size="lg">
        {isLoading ? 'Please wait...' : buttonText}
      </Button>
    </div>
  );
};

export default function Home() {
  const [loading, setLoading] = useState<'quick' | 'login' | null>(null);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleQuickCheck = () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Service Not Available',
        description:
          'The authentication service is not ready. Please try again in a moment.',
      });
      return;
    }

    setLoading('quick');
    router.push('/symptoms'); // ✅ simple redirect
  };

  const handleLogin = () => {
    setLoading('login');
    router.push('/login');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4 font-body">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary md:text-5xl">
          Hellcure
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
          isLoading={loading === 'quick'}
        />
        <FeatureCard
          icon={<User className="h-12 w-12 text-blue-500" />}
          title="Secure Login"
          description="Sign in or create an account to get personalized health insights and track your progress."
          buttonText="Sign In / Sign Up"
          onClick={handleLogin}
          isLoading={loading === 'login'}
        />
      </div>
    </main>
  );
}
