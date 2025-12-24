
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LoaderCircle,
  User,
  LogOut,
  ClipboardList,
  CalendarDays,
  HeartPulse
} from 'lucide-react';

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <Card
    className="cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    auth.signOut();
    router.push('/login');
  };

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
    );
  }
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-primary to-green-400 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-white/50">
                <AvatarImage src={userProfile?.photoURL} alt={userProfile?.username} />
                <AvatarFallback className="bg-white/30 text-white">
                {getInitials(userProfile?.username)}
                </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
                Welcome, {userProfile?.username || 'User'}!
            </h1>
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="hover:bg-white/20 hover:text-white">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
            <Card className="mb-8 bg-green-100 border-green-200">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-green-800">Have a new health concern?</h2>
                        <p className="text-green-700">Get instant guidance by checking your symptoms.</p>
                    </div>
                    <Button
                        onClick={() => router.push('/symptoms')}
                        className="bg-primary hover:bg-primary/90 text-white"
                        size="lg"
                    >
                        <HeartPulse className="mr-2 h-5 w-5"/>
                        Check New Symptom
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ActionCard 
                    icon={<User className="h-8 w-8"/>}
                    title="My Profile"
                    description="View and update your details"
                    onClick={() => router.push('/profile')}
                />
                 <ActionCard 
                    icon={<ClipboardList className="h-8 w-8"/>}
                    title="Medicine Tracker"
                    description="Manage your prescriptions"
                    onClick={() => {}}
                />
                 <ActionCard 
                    icon={<CalendarDays className="h-8 w-8"/>}
                    title="Daily Tracker"
                    description="Log your daily health metrics"
                    onClick={() => {}}
                />
            </div>
        </div>
      </main>
    </div>
  );
}
