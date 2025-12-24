"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  diagnoseSymptoms,
  type DiagnoseSymptomsOutput,
  type DiagnoseSymptomsInput,
} from "@/ai/flows/diagnose-symptoms-flow";
import { AlertTriangle, HeartPulse, ShieldCheck, MapPinned } from "lucide-react";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useDoc, useMemoFirebase } from "@/firebase/firestore/use-doc";


type RiskLevel = "Green" | "Yellow" | "Red";
// This is a simplified categorization for the purpose of the demo.
// A real app would have a more sophisticated mapping.
type ProblemType = "Heart" | "Brain" | "Skin" | "Bone" | "General";

/* ---------------- GOOGLE MAPS URL BUILDER ---------------- */

const getSpecialistSearchQuery = (analysis: string): ProblemType => {
  const lowerCaseAnalysis = analysis.toLowerCase();
  if (lowerCaseAnalysis.includes('cardiac') || lowerCaseAnalysis.includes('heart')) return 'Heart';
  if (lowerCaseAnalysis.includes('neurological') || lowerCaseAnalysis.includes('brain')) return 'Brain';
  if (lowerCaseAnalysis.includes('dermatological') || lowerCaseAnalysis.includes('skin')) return 'Skin';
  if (lowerCaseAnalysis.includes('orthopedic') || lowerCaseAnalysis.includes('bone') || lowerCaseAnalysis.includes('fracture')) return 'Bone';
  return 'General';
};

const buildGoogleMapsUrl = (problemType: ProblemType): string => {
  const queryMap: Record<ProblemType, string> = {
    Heart: "cardiology hospital near me",
    Brain: "neurology hospital near me",
    Skin: "dermatology hospital near me",
    Bone: "orthopedic hospital near me",
    General: "general hospital near me",
  };
  const query = encodeURIComponent(queryMap[problemType]);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

/* ---------------- RESULT CARD ---------------- */

const ResultCard: React.FC<{
  level: RiskLevel;
  analysis: string;
  precautions?: string[];
  nextAction?: string;
}> = ({ level, analysis, precautions, nextAction }) => {
  const config = {
    Green: {
      bg: "bg-green-100 border-green-500 text-green-800",
      icon: <ShieldCheck className="h-16 w-16" />,
      title: "Minor Problem",
    },
    Yellow: {
      bg: "bg-yellow-100 border-yellow-500 text-yellow-800",
      icon: <AlertTriangle className="h-16 w-16" />,
      title: "Caution Advised",
    },
    Red: {
      bg: "bg-red-100 border-red-500 text-red-800",
      icon: <HeartPulse className="h-16 w-16" />,
      title: "Emergency",
    },
  };

  const { bg, icon, title } = config[level];

  return (
    <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-lg ${bg}`}>
      <div className="mb-4 flex justify-center">{icon}</div>
      <h2 className="mb-2 text-center text-3xl font-bold">{title}</h2>
      <p className="mb-4 text-center text-lg font-semibold">{analysis}</p>

      {precautions && precautions.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-lg font-semibold">What you can do now:</h3>
          <ul className="list-disc space-y-1 pl-5">
            {precautions.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {nextAction && (
        <p className="mt-4 text-center font-medium">
          Next step: {nextAction}
        </p>
      )}
    </div>
  );
};

/* ---------------- RESULT PAGE ---------------- */

export default function ResultPage() {
  const [result, setResult] = useState<DiagnoseSymptomsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Wait for all user data to be loaded
    if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) return;
    
    // Ensure this runs only once after user data is confirmed
    if (!user) return;


    const fetchResult = async () => {
      let description: string | null = null;
      let image: string | null = null;

      // Safely get items from localStorage
      try {
        description = localStorage.getItem("symptomDescription");
        image = localStorage.getItem("symptomImage");
      } catch (e) {
        setError("Could not access stored symptom data. Please try again.");
        setLoading(false);
        return;
      }
      
      if (!description && !image) {
        // Redirect if no data is present, as it might be a stale page visit
        router.replace('/symptoms');
        return;
      }

      try {
        const input: DiagnoseSymptomsInput = {
          description: description || "",
          photoDataUri: image || undefined,
          userDetails: user.isAnonymous || !userProfile
            ? {}
            : {
                name: userProfile.username,
                age: String(userProfile.age),
                weight: String(userProfile.weight),
                gender: (userProfile as any).gender, // Add gender if available
              },
        };

        const res = await diagnoseSymptoms(input);
        
        if (!res || typeof res !== 'object' || !res.riskLevel) {
           throw new Error("AI did not return a valid analysis. Please try again.");
        }

        setResult(res);
      } catch(e: any) {
        setError(e.message || "Could not analyze symptoms. Please try again.");
      } finally {
        setLoading(false);
        // Clean up localStorage after fetching
        try {
          if (description) localStorage.removeItem("symptomDescription");
          if (image) localStorage.removeItem("symptomImage");
        } catch (e) {
          console.error("Failed to clear localStorage:", e);
        }
      }
    };

    fetchResult();
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  const handleNextStep = () => {
    if (user?.isAnonymous) {
      router.push("/symptoms");
    } else {
      router.push("/dashboard");
    }
  }

  const handleSignOut = () => {
    auth?.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed border-green-600 rounded-full animate-spin" />
        <p className="mt-4 text-green-700 text-xl">
          Analyzing your symptoms safely...
        </p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Analysis Failed</h1>
        <p className="text-red-600 max-w-md mb-6">{error}</p>
        <Button
          onClick={() => router.push("/symptoms")}
          variant="outline"
        >
          Start Over
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <ResultCard
        level={result.riskLevel}
        analysis={result.analysis}
        precautions={result.precautions}
        nextAction={result.nextAction}
      />

      {result.hospitalRequired && (
        <Button
          onClick={() =>
            window.open(buildGoogleMapsUrl(getSpecialistSearchQuery(result.analysis)), "_blank")
          }
          className="mt-6 w-full max-w-md bg-blue-600 text-white py-3 rounded-lg text-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <MapPinned />
          Find Nearby Specialist Hospital
        </Button>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={handleNextStep} className="w-full">
            {user?.isAnonymous ? 'Check Another Symptom' : 'Go to Dashboard'}
        </Button>
        {user?.isAnonymous && (
           <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign In / Sign Up
          </Button>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-500 text-center max-w-md">
        This is AI-assisted guidance for a hackathon project and not a medical
        diagnosis. Always consult a healthcare professional.
      </p>
    </div>
  );
}
