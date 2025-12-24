'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';

import {
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { LoaderCircle, PlusCircle, ArrowLeft } from 'lucide-react';

/* ---------------- SCHEMA ---------------- */
const medicineSchema = z.object({
  name: z.string().min(2, 'Medicine name required'),
  dosage: z.string().min(1, 'Dosage required'),
  times: z.array(z.enum(['Morning', 'Afternoon', 'Night'])).min(1),
});

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  times: ('Morning' | 'Afternoon' | 'Night')[];
  createdAt: Timestamp;
};

/* ---------------- MEDICINE CARD ---------------- */
const MedicineCard = ({ medicine }: { medicine: Medicine }) => (
  <Card>
    <CardHeader>
      <CardTitle>{medicine.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm">Dosage: <b>{medicine.dosage}</b></p>
      <div className="flex gap-2 text-sm">
        {medicine.times.map((t) => (
          <span
            key={t}
            className="rounded bg-blue-100 px-2 py-1 text-blue-700"
          >
            {t}
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
);

/* ---------------- ADD MEDICINE ---------------- */
const AddMedicineDialog = ({ onAdded }: { onAdded: () => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      dosage: '',
      times: [],
    },
  });

  const onSubmit = async (values: any) => {
    if (!user || !firestore) return;

    await addDocumentNonBlocking(
      collection(firestore, `users/${user.uid}/medicines`),
      {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
      }
    );

    form.reset();
    setOpen(false);
    onAdded();
  };

  const timeOptions = ['Morning', 'Afternoon', 'Night'] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" /> Add Medicine
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Medicine</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Medicine Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="dosage" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="times" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Time of Day</FormLabel>
                <div className="flex gap-4">
                  {timeOptions.map((t) => (
                    <label key={t} className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value.includes(t)}
                        onCheckedChange={(c) =>
                          c
                            ? field.onChange([...field.value, t])
                            : field.onChange(field.value.filter((v: string) => v !== t))
                        }
                      />
                      {t}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- PAGE ---------------- */
export default function MedicineDashboard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const medicinesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `users/${user.uid}/medicines`);
  }, [firestore, user?.uid]);

  const { data: medicines, isLoading } =
    useCollection<Medicine>(medicinesRef);

  if (isUserLoading) {
    return <LoaderCircle className="mx-auto mt-20 animate-spin" />;
  }

  if (!user) {
    router.replace('/auth');
    return null;
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          <ArrowLeft /> Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Medicine Dashboard</h1>
      </header>

      <AddMedicineDialog onAdded={() => {}} />

      {isLoading ? (
        <LoaderCircle className="mx-auto mt-10 animate-spin" />
      ) : medicines && medicines.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {medicines.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </div>
      ) : (
        <Card className="mt-6 p-6 text-center text-muted-foreground">
          No medicines added yet
        </Card>
      )}
    </div>
  );
}
