
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useFirestore,
  useUser,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Save,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDoc, useMemoFirebase } from '@/firebase/firestore/use-doc';


const profileSchema = z.object({
  age: z.coerce
    .number()
    .min(1, 'Age must be positive')
    .max(120, 'Age seems unlikely'),
  weight: z.coerce
    .number()
    .min(10, 'Weight must be at least 10 kg')
    .max(500, 'Weight seems unlikely'),
  height: z.coerce
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height seems unlikely'),
});

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

const EditableInfoField = ({ control, name, label, icon }: any) => (
  <div className="flex items-center space-x-4 rounded-lg bg-gray-100 p-3">
    <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
    <div className="flex-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <>
            <Input
              type="number"
              className="h-8 border-0 bg-transparent p-0 text-lg font-semibold text-gray-800 focus-visible:ring-0"
              {...field}
            />
            {fieldState.error && (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      age: userProfile?.age || 0,
      weight: userProfile?.weight || 0,
      height: userProfile?.height || 0,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (userProfile) {
      reset({
        age: userProfile.age,
        weight: userProfile.weight,
        height: userProfile.height,
      });
    }
  }, [userProfile, reset]);

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
        title: 'Profile picture updated!',
        description: 'Your new picture has been saved.',
      });
    };
    reader.onerror = (error) => {
      setIsUploading(false);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not read the selected file. Please try another image.',
      });
      console.error('File reading error:', error);
    };
  };

  const handleEditToggle = () => {
    if (isEditing) {
      reset({
        age: userProfile?.age,
        weight: userProfile?.weight,
        height: userProfile?.height,
      });
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    if (!userProfileRef) return;
    setIsSaving(true);
    updateDocumentNonBlocking(userProfileRef, data);
    // This is a non-blocking update, so we can give immediate feedback.
    // The useDoc hook will eventually reflect the change.
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast({
        title: 'Profile Saved',
        description: 'Your details have been updated.',
      });
    }, 500); // Simulate a short delay for UX
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  if (isUserLoading || isProfileLoading || !userProfile || !isMounted) {
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

        <Card
          className={cn(
            'overflow-hidden shadow-lg transition-transform duration-500 ease-out',
            isMounted ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <CardHeader className="bg-gradient-to-r from-primary to-green-400 p-6 text-white sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white/80">
                    <AvatarImage
                      src={userProfile.photoURL}
                      alt={userProfile.username}
                    />
                    <AvatarFallback className="bg-white/30 text-3xl text-white">
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
                    disabled={isUploading || isEditing}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold">
                    {userProfile.username}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {userProfile.email}
                  </CardDescription>
                </div>
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  className="border-white/50 bg-white/20 text-white hover:bg-white/30"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditToggle}
                    className="text-white hover:bg-white/20 hover:text-white"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    size="sm"
                    disabled={isSaving || !isDirty}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {!isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <InfoCard
                      icon={<Mail className="h-6 w-6" />}
                      label="Email"
                      value={userProfile.email}
                    />
                    <EditableInfoField
                      control={control}
                      name="age"
                      label="Age (years)"
                      icon={<Activity className="h-5 w-5" />}
                    />
                    <EditableInfoField
                      control={control}
                      name="weight"
                      label="Weight (kg)"
                      icon={<Scale className="h-5 w-5" />}
                    />
                    <EditableInfoField
                      control={control}
                      name="height"
                      label="Height (cm)"
                      icon={<Ruler className="h-5 w-5" />}
                    />
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
