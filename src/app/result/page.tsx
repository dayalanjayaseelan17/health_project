"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  diagnoseSymptoms,
  type DiagnoseSymptomsOutput,
  type DiagnoseSymptomsInput,
} from "@/ai/flows/diagnose-symptoms-flow";
import { AlertTriangle, HeartPulse, ShieldCheck, MapPinned } from "lucide-react";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

type RiskLevel = "Green" | "Yellow" | "Red";
type ProblemType = "Heart" | "Brain" | "Skin" | "Bone" | "General";

/* ---------------- GOOGLE MAPS URL BUILDER ---------------- */

const getSpecialistSearchQuery = (problemType: ProblemType): string => {
  switch (problemType) {
    case "Heart":
      return "cardiology hospital near me";
    case "Brain":
      return "neurology hospital near me";
    case "Skin":
      return "dermatology hospital near me";
    case "Bone":
      return "orthopedic hospital near me";
    default:
      return "general hospital near me";
  }
};

const buildGoogleMapsUrl = (problemType: ProblemType): string => {
  const query = encodeURIComponent(getSpecialistSearchQuery(problemType));
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
      <div className="flex justify-center mb-4">{icon}</div>
      <h2 className="text-3xl font-bold text-center mb-2">{title}</h2>
      <p className="text-lg text-center font-semibold mb-4">{analysis}</p>

      {precautions && precautions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-2">What you can do now:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {precautions.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {nextAction && (
        <p className="mt-4 font-medium text-center">
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

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || isProfileLoading || !user) return;

    const fetchResult = async () => {
      let description = null;
      let image = null;

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
        setError("No symptoms were provided. Please go back and describe your symptoms.");
        setLoading(false);
        return;
      }

      try {
        const input: DiagnoseSymptomsInput = {
          description: description || "",
          photoDataUri: image || undefined,
          userDetails: user.isAnonymous
            ? {}
            : {
                name: userProfile?.username,
                age: String(userProfile?.age),
                weight: String(userProfile?.weight),
                gender: userProfile?.gender,
              },
        };

        const res = await diagnoseSymptoms(input);
        
        if (!res || typeof res !== 'object') {
           throw new Error("AI did not return a valid analysis.");
        }

        setResult(res);
      } catch(e: any) {
        setError(e.message || "Could not analyze symptoms. Please try again.");
      } finally {
        setLoading(false);
        // Clean up localStorage after fetching
        try {
          localStorage.removeItem("symptomDescription");
          localStorage.removeItem("symptomImage");
        } catch (e) {
          console.error("Failed to clear localStorage:", e);
        }
      }
    };

    fetchResult();
  }, [user, isUserLoading, isProfileLoading, userProfile]);

  if (loading || isUserLoading || isProfileLoading) {
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
        <button
          onClick={() => router.push("/symptoms")}
          className="mt-4 text-gray-600 underline"
        >
          Start Over
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <ResultCard
        level={result.riskLevel}
        analysis={result.analysis}
        precautions={result.precautions}
        nextAction={result.nextAction}
      />

      {(result.riskLevel === "Yellow" || result.riskLevel === "Red") && result.problemType && (
        <button
          onClick={() =>
            window.open(buildGoogleMapsUrl(result.problemType!), "_blank")
          }
          className="mt-6 w-full max-w-md bg-blue-600 text-white py-3 rounded-lg text-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <MapPinned />
          Find Nearby Specialist Hospital
        </button>
      )}

      <button
        onClick={() => router.push("/symptoms")}
        className="mt-4 text-gray-600 underline"
      >
        Start Over
      </button>

      <p className="mt-6 text-xs text-gray-500 text-center max-w-md">
        This is AI-assisted guidance for a hackathon project and not a medical
        diagnosis. Always consult a healthcare professional.
      </p>
    </div>
  );
}
