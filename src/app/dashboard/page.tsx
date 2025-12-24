
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LoaderCircle,
  User,
  Activity,
  Scale,
  Ruler,
  LogOut,
  ClipboardList,
  CalendarDays,
} from 'lucide-react';

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
            Welcome, {userProfile?.username || 'User'}!
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Medicine Tracker</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>Daily Tracker</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            onClick={() => router.push('/symptoms')}
            className="mt-8 w-full sm:w-auto"
          >
            Check New Symptom
          </Button>
        </div>
      </main>
    </div>
  );
}
