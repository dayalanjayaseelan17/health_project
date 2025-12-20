import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DetailsPage() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-start bg-background p-4 md:p-8">
      <div className="w-full">
        <Link href="/" className="mb-8 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Link>
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="font-headline text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Guidance Details
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            This is where the health guidance content will be displayed. The
            information will be simple, clear, and easy to understand for
            everyone.
          </p>
        </div>
      </div>
    </main>
  );
}
