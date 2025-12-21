"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SymptomsPage() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ NEW
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description && !image) {
      setError("Please describe your problem or upload an image.");
      return;
    }

    setError("");
    setLoading(true); // ✅ START LOADING

    // Save description
    localStorage.setItem("symptomDescription", description);

    if (image) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          localStorage.setItem("symptomImage", event.target.result);
        }
        router.push("/result");
      };
      reader.readAsDataURL(image);
    } else {
      localStorage.removeItem("symptomImage");
      router.push("/result");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          Describe Your Problem
        </h1>
        <p className="text-center text-gray-600 mb-6">
          You can type or upload a photo
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your problem (for example: fever for 2 days, pain in leg, bleeding)"
            className="w-full p-3 border rounded h-32 text-lg"
            disabled={loading} // ✅ disable while loading
          />

          <div className="text-center">
            <label
              htmlFor="image-upload"
              className={`cursor-pointer inline-block px-6 py-3 rounded-lg text-lg ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              Upload Image (optional)
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={loading} // ✅ disable
            />
            {image && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {image.name}
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-xl font-bold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white"
            }`}
          >
            {loading ? "Checking health… ⏳" : "Check Health"}
          </button>

          {/* ✅ Loading message */}
          {loading && (
            <p className="text-center text-gray-600 text-sm">
              Please wait, analyzing safely using AI…
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
