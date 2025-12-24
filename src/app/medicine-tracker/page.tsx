
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, formatISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  LoaderCircle,
  PlusCircle,
  CalendarIcon,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Pill,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

/* ---------------- ZOD SCHEMA ---------------- */
const medicineSchema = z.object({
  name: z.string().min(2, 'Medicine name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.enum(['Once', 'Twice', 'Thrice']),
  times: z
    .array(z.string())
    .refine((value) => value.some((item) => item), 'Select at least one time.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});


type Medicine = {
  id: string;
  name: string;
  dosage: string;
  times: ('Morning' | 'Afternoon' | 'Night')[];
  startDate: Timestamp;
  endDate: Timestamp;
};

type MedicineStatus = {
  id: string;
  date: string;
  status: Record<'Morning' | 'Afternoon' | 'Night', 'Pending' | 'Taken' | 'Missed'>;
};


/* ---------------- ADD MEDICINE DIALOG ---------------- */
const AddMedicineDialog = ({ onMedicineAdded }: { onMedicineAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof medicineSchema>>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      dosage: '',
      times: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof medicineSchema>) => {
    if (!user || !firestore) return;
    setLoading(true);

    try {
      const medicinesRef = collection(firestore, `users/${user.uid}/medicines`);
      await addDocumentNonBlocking(medicinesRef, {
        ...values,
        userId: user.uid,
        startDate: values.startDate,
        endDate: values.endDate,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Medicine Added!', description: `${values.name} has been added to your tracker.` });
      form.reset();
      setOpen(false);
      onMedicineAdded();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add medicine.' });
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = ['Morning', 'Afternoon', 'Night'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <PlusCircle className="mr-2" /> Add New Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Medicine</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paracetamol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 500 mg or 1 tablet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select how often" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Once">Once a day</SelectItem>
                      <SelectItem value="Twice">Twice a day</SelectItem>
                      <SelectItem value="Thrice">Thrice a day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="times"
              render={() => (
                <FormItem>
                  <FormLabel>Time of Day</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {timeOptions.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="times"
                        render={({ field }) => (
                          <FormItem key={item} className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(field.value?.filter((value) => value !== item));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < startOfDay(new Date(new Date().setDate(new Date().getDate()-1)))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < startOfDay(form.getValues('startDate') || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Add Medicine
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


/* ---------------- MEDICINE CARD ---------------- */
const MedicineCard = ({ medicine, status, onUpdate, onDelete, date }: {
  medicine: Medicine;
  status: 'Pending' | 'Taken' | 'Missed';
  onUpdate: (newStatus: 'Taken' | 'Missed') => void;
  onDelete: () => void;
  date: string;
}) => {
  const statusConfig = {
    Pending: {
      color: 'bg-gray-100 border-gray-300',
      icon: <Clock className="text-gray-500" />,
      text: 'Pending',
    },
    Taken: {
      color: 'bg-green-100 border-green-400',
      icon: <CheckCircle className="text-green-600" />,
      text: 'Taken',
    },
    Missed: {
      color: 'bg-red-100 border-red-400',
      icon: <XCircle className="text-red-600" />,
      text: 'Missed',
    },
  };

  return (
    <Card className={cn('overflow-hidden transition-all', statusConfig[status].color)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-lg">{medicine.name}</h3>
            <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
            <div className="flex items-center gap-2 pt-2">
              {statusConfig[status].icon}
              <span className="font-semibold text-sm">{statusConfig[status].text}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:bg-red-100 hover:text-red-600">
            <Trash2 size={18} />
          </Button>
        </div>
        {status === 'Pending' && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button onClick={() => onUpdate('Taken')} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle size={16} className="mr-2" /> Taken
            </Button>
            <Button onClick={() => onUpdate('Missed')} size="sm" className="bg-red-600 hover:bg-red-700">
              <XCircle size={16} className="mr-2" /> Missed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


/* ---------------- PAGE ---------------- */
export default function MedicineTrackerPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [refresher, setRefresher] = useState(0); // Used to force-refresh data
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  // --- Data Fetching ---
  const medicinesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `users/${user.uid}/medicines`);
  }, [firestore, user?.uid]);

  const { data: allMedicines, isLoading: isMedsLoading } = useCollection<Medicine>(medicinesRef);
  
  const medicineStatusesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `users/${user.uid}/medicineStatuses`),
        where('date', '==', today)
    );
  }, [firestore, user?.uid, today]);

  const { data: todayStatuses, isLoading: isStatusLoading } = useCollection<MedicineStatus>(medicineStatusesRef);


  // --- Auth Check ---
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);


  // --- Data Processing & Memoization ---
  const medicinesForToday = useMemo(() => {
    if (!allMedicines) return [];
    const todayDate = startOfDay(new Date());
    return allMedicines.filter(med => {
      const startDate = med.startDate.toDate();
      const endDate = endOfDay(med.endDate.toDate());
      return isWithinInterval(todayDate, { start: startDate, end: endDate });
    });
  }, [allMedicines]);
  
  const schedule = useMemo(() => {
    if (isMedsLoading || isStatusLoading) return [];
    
    const combined = [];
    const statusMap = new Map(todayStatuses?.map(s => [s.id.split('_')[0], s.status]));

    for (const med of medicinesForToday) {
      const statuses = statusMap.get(med.id);
      for (const time of med.times) {
        combined.push({
          medicine: med,
          time,
          status: statuses?.[time] || 'Pending',
        });
      }
    }
    return combined.sort((a, b) => {
        const timeOrder = { Morning: 0, Afternoon: 1, Night: 2 };
        return timeOrder[a.time] - timeOrder[b.time];
    });
  }, [medicinesForToday, todayStatuses, isMedsLoading, isStatusLoading]);


  // --- Handlers ---
  const handleUpdateStatus = async (medicineId: string, time: string, newStatus: 'Taken' | 'Missed') => {
    if (!user || !firestore) return;
    
    const statusDocId = `${medicineId}_${today}`;
    const statusRef = doc(firestore, `users/${user.uid}/medicineStatuses/${statusDocId}`);
    
    // Using dot notation to update a specific field in the map
    const updatePayload = { [`status.${time}`]: newStatus };

    try {
        await setDocumentNonBlocking(statusRef, updatePayload, { merge: true });
        // The real-time listener will handle the UI update
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the medicine status.",
        });
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!user || !firestore) return;
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) return;

    try {
      const medRef = doc(firestore, `users/${user.uid}/medicines/${medicineId}`);
      await deleteDocumentNonBlocking(medRef);

      // Also delete related statuses
      const statusQuery = query(
          collection(firestore, `users/${user.uid}/medicineStatuses`),
          where('medicineId', '==', medicineId)
      );
      const statusSnap = await getDocs(statusQuery);
      const batch = writeBatch(firestore);
      statusSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      toast({ title: 'Medicine Deleted' });
      // UI will update automatically via the hook
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete medicine.' });
    }
  };

  // When a new medicine is added, we need to create its status doc for today if it doesn't exist
  const createInitialStatusRecords = async () => {
    if (!user || !firestore || !medicinesForToday.length) return;
    
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    const batch = writeBatch(firestore);
    
    for (const med of medicinesForToday) {
      const statusDocId = `${med.id}_${todayDateStr}`;
      const statusRef = doc(firestore, `users/${user.uid}/medicineStatuses`, statusDocId);
      
      const initialStatus: any = {};
      med.times.forEach(time => initialStatus[time] = 'Pending');
      
      // We use set with merge:true to create or update without overwriting other days' data
      // This also initializes the document if it's the first time for the day.
      batch.set(statusRef, {
        medicineId: med.id,
        date: todayDateStr,
        status: initialStatus
      }, { merge: true });
    }
    
    try {
      await batch.commit();
    } catch(e) {
      console.error("Failed to create initial status records", e);
    }
  };

  useEffect(() => {
    if(medicinesForToday.length > 0 && !isStatusLoading) {
      createInitialStatusRecords();
    }
  }, [medicinesForToday, isStatusLoading]);


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
             <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-lg font-bold text-primary"
              >
                <ArrowLeft />
                Medicine Tracker
              </Button>
            <AddMedicineDialog onMedicineAdded={() => setRefresher(r => r + 1)} />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Today's Schedule</h2>
            <p className="text-muted-foreground">{format(new Date(), 'eeee, MMMM d, yyyy')}</p>
          </div>

          {(isMedsLoading || isStatusLoading) ? (
            <div className="text-center">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p>Loading your schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center bg-gray-100 border-2 border-dashed">
                <Pill size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Medicines Scheduled for Today</h3>
                <p className="text-gray-500 mt-2">Add a new medicine to start tracking your schedule.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {['Morning', 'Afternoon', 'Night'].map(timeSlot => {
                  const itemsForSlot = schedule.filter(item => item.time === timeSlot);
                  if (itemsForSlot.length === 0) return null;
                  
                  return (
                    <div key={timeSlot}>
                        <h3 className="text-lg font-semibold mb-2 capitalize border-b pb-1">{timeSlot}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itemsForSlot.map(item => (
                            <MedicineCard
                            key={`${item.medicine.id}-${item.time}`}
                            medicine={item.medicine}
                            status={item.status}
                            date={today}
                            onUpdate={(newStatus) => handleUpdateStatus(item.medicine.id, item.time, newStatus)}
                            onDelete={() => handleDeleteMedicine(item.medicine.id)}
                            />
                        ))}
                        </div>
                    </div>
                  )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
