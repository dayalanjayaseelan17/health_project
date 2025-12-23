// This page is no longer needed as user details are collected during sign-up.
// We can delete this file, but for now, we'll just redirect.

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DetailsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/symptoms");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <p>Redirecting...</p>
    </div>
  );
}
