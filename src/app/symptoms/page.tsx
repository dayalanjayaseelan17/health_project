"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera } from "lucide-react";

export default function SymptomsPage() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  /* ---------------- AUTH CHECK ---------------- */

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
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

  /* ---------------- IMAGE HANDLER ---------------- */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setError("Please describe your problem or upload/take a photo.");
      return;
    }

    setError("");
    setLoading(true);

    localStorage.setItem("symptomDescription", description);
    localStorage.removeItem("symptomImage");

    if (image) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          localStorage.setItem("symptomImage", reader.result);
        }
        router.push("/result");
      };
      reader.onerror = () => {
        setError("Failed to read image file.");
        setLoading(false);
      };
      setLoading(true);

      reader.readAsDataURL(image);
    } else {
      router.push("/result");
    }
  };

  /* ---------------- LOADING STATE ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* 🔴 DEPLOY CHECK — REMOVE AFTER CONFIRMING */}
      <p className="text-xs text-red-600 text-center font-bold">
        DEPLOY CHECK – SYMPTOMS CAMERA VERSION
      </p>

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">
              Describe Your Problem
            </h1>
            <p className="mt-2 text-muted-foreground">
              You can type, take a photo, or both.
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
                placeholder="e.g., fever for 2 days, pain in leg, skin rash..."
                className="min-h-[120px] resize-none rounded-lg p-3 text-base"
                disabled={loading}
              />
            </div>

            {/* IMAGE UPLOAD / CAMERA */}
            <div className="space-y-2">
              <label className="font-medium text-gray-800">
                Take or Upload a Photo (Optional)
              </label>

              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-contain rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">
                        Tap to choose Camera or Gallery
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG supported
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
                <p className="text-sm text-center text-gray-500">
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
    </>
  );
}
