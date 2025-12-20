"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  diagnoseSymptoms,
  type DiagnoseSymptomsOutput,
  type DiagnoseSymptomsInput,
} from "@/ai/flows/diagnose-symptoms-flow";
import { AlertTriangle, HeartPulse, ShieldCheck } from "lucide-react";

type RiskLevel = "Green" | "Yellow" | "Red";

const ResultCard: React.FC<{ level: RiskLevel; guidance: string; analysis: string }> = ({
  level,
  guidance,
  analysis,
}) => {
  const config = {
    Green: {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-500",
      icon: <ShieldCheck className="h-16 w-16" />,
      title: "Minor Problem",
    },
    Yellow: {
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-500",
      icon: <AlertTriangle className="h-16 w-16" />,
      title: "Caution Advised",
    },
    Red: {
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-500",
      icon: <HeartPulse className="h-16 w-16" />,
      title: "Emergency",
    },
  };

  const { bgColor, textColor, borderColor, icon, title } = config[level];

  return (
    <div className={`w-full max-w-md rounded-2xl shadow-lg p-6 text-center ${bgColor} ${textColor} border-2 ${borderColor}`}>
      <div className="flex justify-center mb-4">{icon}</div>
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      <p className="text-lg font-semibold mb-4">{analysis}</p>
      <p className="text-lg">{guidance}</p>
    </div>
  );
};


export default function ResultPage() {
  const [result, setResult] = useState<DiagnoseSymptomsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getResult = async () => {
      setLoading(true);
      setError(null);
      
      const userDetailsString = localStorage.getItem("userDetails");
      const symptomDescription = localStorage.getItem("symptomDescription");
      const symptomImage = localStorage.getItem("symptomImage");

      if (!symptomDescription && !symptomImage) {
        setError("No symptoms were provided. Please go back and describe your problem.");
        setLoading(false);
        return;
      }
      
      try {
        const userDetails = userDetailsString ? JSON.parse(userDetailsString) : {};

        const input: DiagnoseSymptomsInput = {
          description: symptomDescription || "",
          photoDataUri: symptomImage || undefined,
          userDetails: userDetails,
        };

        const diagnosisResult = await diagnoseSymptoms(input);
        setResult(diagnosisResult);

      } catch (e) {
        console.error(e);
        setError("Could not get a diagnosis. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getResult();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {loading && (
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
            <p className="text-green-700 mt-4 text-xl">Analyzing your symptoms...</p>
        </div>
      )}
      
      {error && !loading && <p className="text-red-500 text-center text-lg">{error}</p>}

      {result && !loading && (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <ResultCard level={result.riskLevel} guidance={result.guidance} analysis={result.analysis} />
          
          {result.riskLevel === "Red" && (
            <button className="w-full bg-red-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-red-700">
              Find Nearest Hospital
            </button>
          )}

          <div className="text-center text-xs text-gray-500 p-4 border-t-2 border-gray-200 mt-4">
            <p className="font-bold">Disclaimer:</p>
            <p>This is AI-assisted guidance, not a medical diagnosis. This tool is for a hackathon and is not a real medical service. Always consult a qualified healthcare professional for medical advice.</p>
          </div>
          
           <button onClick={() => router.push('/')} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-lg">
                Start Over
            </button>
        </div>
      )}
    </div>
  );
}
