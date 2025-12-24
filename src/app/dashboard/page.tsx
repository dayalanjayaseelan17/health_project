'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoaderCircle, User, Activity, Scale, Ruler } from 'lucide-react';

const StatCard = ({
  icon,
  title,
  value,
  unit,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value} <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (user?.isAnonymous) {
      router.replace('/symptoms');
      return null;
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-600">Loading User Profile...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight tracking-tight text-gray-900">
            <User className="h-7 w-7 text-primary" />
            Welcome, {userProfile?.username || 'User'}!
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Scale className="h-4 w-4 text-muted-foreground" />}
              title="Weight"
              value={userProfile.weight}
              unit="kg"
            />
            <StatCard
              icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
              title="Height"
              value={userProfile.height}
              unit="cm"
            />
            <StatCard
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              title="Age"
              value={userProfile.age}
              unit="years"
            />
          </div>
           <Button
            onClick={() => router.push("/symptoms")}
            className="mt-8 w-full sm:w-auto"
          >
            Check New Symptom
          </Button>
        </div>
      </main>
    </div>
  );
}
