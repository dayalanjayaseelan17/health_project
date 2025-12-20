import { Button } from '@/components/ui/button';
import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center space-y-8 text-center">
        <HeartPulse className="h-20 w-20 text-primary md:h-28 md:w-28" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Health Guidance
        </h1>
        <Link href="/details" className="mt-4">
          <Button
            size="lg"
            className="h-14 rounded-full px-10 text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 md:h-16 md:px-12 md:text-2xl"
          >
            Start
          </Button>
        </Link>
      </div>
    </main>
  );
}
