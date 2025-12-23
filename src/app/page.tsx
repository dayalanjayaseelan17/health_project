"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Swasthya Margdarshan
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your simple guide to better health. Get instant, AI-powered guidance for your health concerns, designed for everyone.
        </p>

        <Link href="/login">
          <Button size="lg" className="rounded-full text-lg px-10 py-6">
            Get Started
          </Button>
        </Link>
      </div>
    </main>
  );
}
