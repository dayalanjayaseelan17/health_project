'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useFirestore,
  useUser,
  addDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
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
import { useToast } from '@/hooks/use-toast';

import {
  LoaderCircle,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';

/* ---------------- ZOD SCHEMA ---------------- */
const medicineSchema = z
  .object({
    name: z.string().min(2, 'Name required'),
    dosage: z.string().min(1, 'Dosage required'),
    times: z.array(z.string()).min(1, 'Please select at least one time'),
    reminderEnabled: z.boolean().default(false),
    reminderEmail: z.string().email().optional().or(z.literal('')),
  })
  .refine((data) => !data.reminderEnabled || !!data.reminderEmail, {
    message: 'Email required when reminder is enabled',
    path: ['reminderEmail'],
  });

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  reminderEnabled?: boolean;
  reminderEmail?: string;
  createdAt: Timestamp;
};

/* ---------------- MEDICINE CARD ---------------- */
const MedicineCard = ({ medicine }: { medicine: Medicine }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{medicine.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Dosage: {medicine.dosage}
        </p>

        {medicine.reminderEnabled ? (
          <div className="text-sm text-green-700">
            🔔 Reminder ON
            {medicine.reminderEmail && (
              <div className="text-xs text-gray-600">
                Email: {medicine.reminderEmail}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">🔕 Reminder OFF</div>
        )}

        {medicine.reminderEnabled && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() =>
              alert(
                `✅ Test reminder sent!\n\nMedicine: ${medicine.name}\nEmail: ${medicine.reminderEmail}`
              )
            }
          >
            🧪 Send Test Reminder
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/* ---------------- ADD MEDICINE DIALOG ---------------- */
const AddMedicineDialog = ({ onAdded }: { onAdded: () => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof medicineSchema>>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      dosage: '',
      times: [],
      reminderEnabled: false,
      reminderEmail: '',
    },
  });

  const onSubmit = (values: z.infer<typeof medicineSchema>) => {
    if (!user || !firestore) return;

    try {
      addDocumentNonBlocking(
        collection(firestore, `users/${user.uid}/medicines`),
        {
          ...values,
          userId: user.uid,
          createdAt: serverTimestamp(),
        }
      );
      toast({ title: 'Medicine Added' });
      form.reset();
      setOpen(false);
      onAdded();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to add medicine',
      });
    }
  };

  const times = ['Morning', 'Afternoon', 'Night'];

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
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="dosage"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="times"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Time of Day
                    </FormLabel>
                  </div>
                  <div className="flex gap-3">
                  {times.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="times"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              name="reminderEnabled"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Enable Email Reminder</FormLabel>
                </FormItem>
              )}
            />

            {form.watch('reminderEnabled') && (
              <FormField
                name="reminderEmail"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
export default function MedicineTrackerPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const medicinesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `users/${user.uid}/medicines`);
  }, [firestore, user]);

  const { data: medicines, isLoading } = useCollection<Medicine>(medicinesRef);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          <ArrowLeft /> Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Medicine Tracker</h1>
      </header>

      <AddMedicineDialog onAdded={() => {}} />

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : medicines && medicines.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {medicines.map((med) => (
            <MedicineCard key={med.id} medicine={med} />
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
