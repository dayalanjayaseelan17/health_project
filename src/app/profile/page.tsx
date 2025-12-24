
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LoaderCircle,
  User,
  Scale,
  Ruler,
  Activity,
  ArrowLeft,
  Mail,
  Edit,
  Loader2,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfileRef) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateDocumentNonBlocking(userProfileRef, { photoURL: dataUrl });
      setIsUploading(false);
      toast({
        title: "Profile picture updated!",
        description: "Your new picture has been saved.",
      });
    };
    reader.onerror = (error) => {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not read the selected file. Please try another image.",
      });
      console.error("File reading error:", error);
    };
  };
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

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

        <Card className={cn(
            "overflow-hidden shadow-lg transition-transform duration-500 ease-out",
            isMounted ? "translate-x-0" : "-translate-x-full"
          )}>
          <CardHeader className="bg-gradient-to-r from-primary to-green-400 p-6 sm:p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white/80">
                  <AvatarImage src={userProfile.photoURL} alt={userProfile.username}/>
                  <AvatarFallback className="bg-white/30 text-white text-3xl">
                    {getInitials(userProfile.username)}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white text-primary hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex-1">
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
