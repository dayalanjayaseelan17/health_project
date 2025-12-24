
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LoaderCircle,
  User,
  Scale,
  Ruler,
  Activity,
  ArrowLeft,
  Mail,
} from 'lucide-react';

const InfoCard = ({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
}) => (
  <div className="flex items-center space-x-4 rounded-lg bg-gray-100 p-4">
    <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">
        {value} {unit}
      </p>
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isProfileLoading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-600">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-green-400 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-white/20 p-4">
                <User className="h-10 w-10" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">
                  {userProfile.username}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Here are your account details.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<Mail className="h-6 w-6" />}
                label="Email"
                value={userProfile.email}
              />
              <InfoCard
                icon={<Activity className="h-6 w-6" />}
                label="Age"
                value={userProfile.age}
                unit="years"
              />
              <InfoCard
                icon={<Scale className="h-6 w-6" />}
                label="Weight"
                value={userProfile.weight}
                unit="kg"
              />
              <InfoCard
                icon={<Ruler className="h-6 w-6" />}
                label="Height"
                value={userProfile.height}
                unit="cm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
