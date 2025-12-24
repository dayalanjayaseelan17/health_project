
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
  useAuth,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LoaderCircle,
  User,
  LogOut,
  ClipboardList,
  CalendarDays,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
  isOpening,
  isFading,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isOpening: boolean;
  isFading: boolean;
}) => (
  <Card
    className={cn(
      'cursor-pointer transition-all duration-300 hover:scale-105 rounded-full aspect-square flex items-center justify-center text-center',
      'bg-white/80 backdrop-blur-sm z-10',
      isOpening && 'scale-110 z-20',
      !isOpening && isFading && 'opacity-0 scale-90'
    )}
    onClick={onClick}
  >
    <CardHeader
      className={cn(
        'flex flex-col items-center gap-2 transition-opacity duration-200 p-4',
        isOpening && 'opacity-0'
      )}
    >
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </div>
    </CardHeader>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [opening, setOpening] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);

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

  const handleNavigation = (path: string, cardId: string) => {
    if (opening) return;
  
    setOpening(cardId);
  
    // Start fading other cards
    setTimeout(() => {
      setIsFading(true);
    }, 50);
  
    // Wait for animation, then navigate
    setTimeout(() => {
      router.push(path);
    }, 500); 
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
              <AvatarImage
                src={userProfile?.photoURL}
                alt={userProfile?.username}
              />
              <AvatarFallback className="bg-white/30 text-white">
                {getInitials(userProfile?.username)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Welcome, {userProfile?.username || 'User'}!
            </h1>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="hover:bg-white/20 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card
            className={cn(
              'mb-8 cursor-pointer border-green-200 bg-green-100/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg rounded-2xl',
              opening && opening !== 'symptoms' && 'opacity-0 scale-90',
              opening === 'symptoms' && 'scale-110 z-10'
            )}
            onClick={() => handleNavigation('/symptoms', 'symptoms')}
          >
            <CardContent className={cn(
              "flex items-center justify-between p-6 transition-opacity duration-200",
              opening === 'symptoms' && 'opacity-0'
            )}>
              <div>
                <h2 className="text-xl font-bold text-green-800">
                  Have a new health concern?
                </h2>
                <p className="text-green-700">
                  Get instant guidance by checking your symptoms.
                </p>
              </div>
              <Button
                className="bg-primary text-white hover:bg-primary/90"
                size="lg"
                tabIndex={-1}
              >
                <HeartPulse className="mr-2 h-5 w-5" />
                Check New Symptom
              </Button>
            </CardContent>
          </Card>

          <div className="blobs-container">
            <div className="blob"></div>
            <div className="blob"></div>
            <div className="blob"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <ActionCard
                icon={<User className="h-8 w-8" />}
                title="My Profile"
                description="View and update your details"
                onClick={() => handleNavigation('/profile', 'profile')}
                isOpening={opening === 'profile'}
                isFading={!!opening && opening !== 'profile'}
                />
                <ActionCard
                icon={<ClipboardList className="h-8 w-8" />}
                title="Medicine Tracker"
                description="Manage your prescriptions"
                onClick={() => handleNavigation('#', 'medicine')}
                isOpening={opening === 'medicine'}
                isFading={!!opening && opening !== 'medicine'}
                />
                <ActionCard
                icon={<CalendarDays className="h-8 w-8" />}
                title="Daily Tracker"
                description="Log your daily health metrics"
                onClick={() => handleNavigation('#', 'daily')}
                isOpening={opening === 'daily'}
                isFading={!!opening && opening !== 'daily'}
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
