"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

export default function SymptomsPage() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for auth state to resolve
    if (!isUserLoading) {
      if (!user) {
        // If still no user, auth failed or wasn't initiated.
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Redirecting to login.",
        });
        router.replace("/login");
      } else if (user.isAnonymous) {
        toast({
          title: "Anonymous Session",
          description: "You can check your symptoms now.",
        });
      }
    }
  }, [user, isUserLoading, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description && !image) {
      setError("Please describe your problem or upload an image.");
      return;
    }

    setError("");
    setLoading(true);

    localStorage.setItem("symptomDescription", description);
    localStorage.removeItem("symptomImage"); // Clear previous image

    if (image) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          localStorage.setItem("symptomImage", event.target.result);
        }
        router.push("/result");
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
        setLoading(false);
      }
      reader.readAsDataURL(image);
    } else {
      router.push("/result");
    }
  };

  if (isUserLoading || !user) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4 font-body">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            Describe Your Problem
          </h1>
          <p className="mt-2 text-muted-foreground">
            You can type, upload a photo, or both.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="description" className="font-medium text-gray-800">
              Symptom Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., fever for 2 days, sharp pain in my right leg, a circular red rash..."
              className="min-h-[120px] resize-none rounded-lg p-3 text-base"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-800">
              Upload an Image (Optional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Symptom preview" className="h-full w-full object-contain rounded-md" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, or JPEG</p>
                  </div>
                )}
                 <input
                    id="image-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
              </label>
            </div>
             {image && (
              <p className="text-sm text-center text-gray-500 pt-2">
                Selected: {image.name}
              </p>
            )}
          </div>
          

          {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading || (!description && !image)}
            className="w-full text-lg font-semibold py-6 rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Health...
              </>
            ) : (
              "Check Health"
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
