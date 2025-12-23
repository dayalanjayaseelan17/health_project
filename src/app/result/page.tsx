"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  diagnoseSymptoms,
  type DiagnoseSymptomsOutput,
  type DiagnoseSymptomsInput,
} from "@/ai/flows/diagnose-symptoms-flow";
import { AlertTriangle, HeartPulse, ShieldCheck } from "lucide-react";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, DocumentData } from "firebase/firestore";

type RiskLevel = "Green" | "Yellow" | "Red";

/* ---------------- RESULT CARD ---------------- */

const ResultCard: React.FC<{
  level: RiskLevel;
  analysis: string;
  precautions?: string[];
  nextAction?: string;
}> = ({ level, analysis, precautions, nextAction }) => {
  const config = {
    Green: {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-500",
      icon: <ShieldCheck className="h-16 w-16" />,
      title: "Minor Problem",
      guidance: "This problem looks minor. You can take rest and basic care at home.",
    },
    Yellow: {
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-500",
      icon: <AlertTriangle className="h-16 w-16" />,
      title: "Caution Advised",
      guidance: "This problem needs attention. Please visit a hospital if possible.",
    },
    Red: {
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-500",
      icon: <HeartPulse className="h-16 w-16" />,
      title: "Emergency",
      guidance: "This is serious. Please go to the nearest hospital immediately.",
    },
  };

  const { bgColor, textColor, borderColor, icon, title, guidance } = config[level];

  return (
    <div
      className={`w-full max-w-md rounded-2xl shadow-lg p-6 ${bgColor} ${textColor} border-2 ${borderColor}`}
    >
      <div className="flex justify-center mb-4">{icon}</div>

      <h2 className="text-3xl font-bold mb-2 text-center">{title}</h2>
      <p className="text-lg font-semibold mb-3 text-center">{analysis}</p>
      <p className="text-lg text-center">{guidance}</p>

      {precautions && precautions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-2">
            What you can do now:
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {precautions.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {nextAction && (
        <p className="mt-4 font-medium">
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
    if (!firestore || !user?.uid) return null;
    // Don't fetch profile for anonymous users as it won't exist.
    if (user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}/profile/${user.uid}`);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    // This effect handles authentication and redirection.
    if (isUserLoading) {
      return; // Wait until auth state is determined
    }
    if (!user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    // This effect handles fetching the diagnosis result.
    // It should only run after we know we have a user.
    if (isUserLoading || isProfileLoading || !user) {
      return;
    }

    const getResult = async () => {
      setLoading(true);
      setError(null);

      const symptomDescription = localStorage.getItem("symptomDescription");
      const symptomImage = localStorage.getItem("symptomImage");

      if (!symptomDescription && !symptomImage) {
        setError("No symptoms were provided. Please go back and describe your problem.");
        setLoading(false);
        return;
      }

      try {
        const input: DiagnoseSymptomsInput = {
          description: symptomDescription || "",
          photoDataUri: symptomImage || undefined,
          userDetails: user.isAnonymous ? {} : (userProfile ? {
            name: userProfile.username,
            age: String(userProfile.age),
            weight: String(userProfile.weight),
            gender: userProfile.gender || "Not specified",
          } : {}),
        };

        const diagnosisResult = await diagnoseSymptoms(input);
        setResult(diagnosisResult);
      } catch (e) {
        console.error(e);
        setError("Could not get guidance. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getResult();
  }, [user, isUserLoading, userProfile, isProfileLoading]);

  const showLoading = loading || isUserLoading || isProfileLoading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {showLoading && (
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600 mx-auto"></div>
          <p className="text-green-700 mt-4 text-xl">
            Analyzing your symptoms safely...
          </p>
        </div>
      )}

      {error && !showLoading && (
        <p className="text-red-500 text-center text-lg">{error}</p>
      )}

      {result && !showLoading && (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <ResultCard
            level={result.riskLevel}
            analysis={result.analysis}
            precautions={result.precautions}
            nextAction={result.nextAction}
          />

          {result.hospitalRequired && (
            <button className="w-full bg-red-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-red-700">
              Find Nearest Hospital
            </button>
          )}

          <div className="text-center text-xs text-gray-500 p-4 border-t-2 border-gray-200 mt-4">
            <p className="font-bold">Disclaimer:</p>
            <p>
              This is AI-assisted guidance, not a medical diagnosis. This tool is
              for a hackathon and is not a real medical service. Always consult a
              qualified healthcare professional.
            </p>
          </div>

          <button
            onClick={() => router.push("/symptoms")}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-lg"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
