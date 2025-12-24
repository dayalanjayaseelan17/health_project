
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
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
  isAnimating,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isAnimating: boolean;
}) => {
  return (
    <motion.div
      layout
      className="relative aspect-square"
      onClick={onClick}
      initial={{ borderRadius: '1rem' }}
      animate={{
        scale: isAnimating ? 1.1 : 1,
        zIndex: isAnimating ? 20 : 10,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="h-full w-full cursor-pointer transition-shadow hover:shadow-lg">
        <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <motion.div
            animate={{
              opacity: isAnimating ? 0 : 1,
              scale: isAnimating ? 0.8 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold">{title}</h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [opening, setOpening] = useState<string | null>(null);

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

  const handleNavigation = (path: string) => {
    if (opening) return;
    setOpening(path);
    setTimeout(() => {
      router.push(path);
      // Reset after navigation to re-enable clicks
      setTimeout(() => setOpening(null), 500);
    }, 400); // Wait for animation
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
        <motion.div
          layout
          className="mx-auto max-w-4xl"
          initial={{ opacity: 1 }}
          animate={{ opacity: opening ? 0 : 1 }}
        >
          <motion.div
            layout
            initial={{ borderRadius: '1rem' }}
            animate={{
              scale: opening === '/symptoms' ? 1.1 : 1,
              zIndex: opening === '/symptoms' ? 20 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card
              className="mb-8 cursor-pointer border-green-200 bg-green-100/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg rounded-2xl"
              onClick={() => handleNavigation('/symptoms')}
            >
              <CardContent className="flex items-center justify-between p-6">
                <motion.div
                  animate={{
                    opacity: opening === '/symptoms' ? 0 : 1,
                    scale: opening === '/symptoms' ? 0.8 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <h2 className="text-xl font-bold text-green-800">
                    Have a new health concern?
                  </h2>
                  <p className="text-green-700">
                    Get instant guidance by checking your symptoms.
                  </p>
                </motion.div>
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
          </motion.div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <ActionCard
              icon={<User className="h-8 w-8" />}
              title="My Profile"
              description="View and update your details"
              onClick={() => handleNavigation('/profile')}
              isAnimating={opening === '/profile'}
            />
            <ActionCard
              icon={<ClipboardList className="h-8 w-8" />}
              title="Medicine Tracker"
              description="Manage your prescriptions"
              onClick={() => handleNavigation('#')}
              isAnimating={opening === '#'}
            />
            <ActionCard
              icon={<CalendarDays className="h-8 w-8" />}
              title="Daily Tracker"
              description="Log your daily health metrics"
              onClick={() => handleNavigation('#')}
              isAnimating={opening === '#'}
            />
            <ActionCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Health Bar"
              description="View your health summary"
              onClick={() => handleNavigation('#')}
              isAnimating={opening === '#'}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
