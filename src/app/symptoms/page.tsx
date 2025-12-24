
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';

export default function SymptomsPage() {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  /* ---------------- AUTH CHECK ---------------- */

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Redirecting to login.',
        });
        router.replace('/login');
      } else if (user.isAnonymous) {
        toast({
          title: 'Anonymous Session',
          description: 'You can check your symptoms now.',
        });
      }
    }
  }, [user, isUserLoading, router, toast]);

  /* ---------------- IMAGE HANDLER ---------------- */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 4MB
    if (file.size > 4 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please upload an image smaller than 4MB.",
      });
      return;
    }

    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description && !image) {
      setError('Please describe your problem or upload an image.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      localStorage.setItem('symptomDescription', description);
      localStorage.removeItem('symptomImage'); // Clear previous image

      if (image) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            localStorage.setItem('symptomImage', reader.result);
          }
          router.push('/result');
        };
        reader.onerror = () => {
          setError('Failed to read image file.');
          setLoading(false);
        };
        reader.readAsDataURL(image);
      } else {
        router.push('/result');
      }
    } catch (storageError) {
       setError('Could not save symptom data. Your browser storage might be full or disabled.');
       setLoading(false);
    }
  };

  /* ---------------- LOADING STATE ---------------- */

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-medium text-gray-700">
          Loading Session...
        </h1>
        <p className="text-gray-500">Please wait while we get things ready.</p>
      </div>
    );
  }
  
  if (!user) {
    // This state is temporary while the redirect to /login happens.
    // Showing a loader prevents a flash of the form.
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            Describe Your Problem
          </h1>
          <p className="mt-2 text-muted-foreground">
            You can either type your problem or upload a photo of it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="font-medium text-gray-800">
              Symptom Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., I have a fever since 2 days and a pain in my leg..."
              className="min-h-[120px] resize-none rounded-lg p-3 text-base"
              disabled={loading}
            />
          </div>

          {/* IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="font-medium text-gray-800">
              Upload or Take a Photo (Optional)
            </label>

            <label
              htmlFor="image-upload"
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Upload className="mb-2 h-8 w-8 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    take a photo
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG supported (Max 4MB)
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            {image && (
              <p className="text-center text-sm text-gray-500">
                Selected: {image.name}
              </p>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={loading || (!description && !image)}
            className="w-full rounded-lg py-6 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Health...
              </>
            ) : (
              'Check Health'
            )}
          </Button>

          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              Please wait, our AI is analyzing your symptoms safely…
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
