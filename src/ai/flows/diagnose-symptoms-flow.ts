'use server';

import { ai } from "@/ai/genkit";
import { z } from "zod";

/* ---------------- USER DETAILS ---------------- */

const UserDetailsSchema = z.object({
  name: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  gender: z.string().optional(),
});

/* ---------------- INPUT ---------------- */

const DiagnoseSymptomsInputSchema = z.object({
  description: z.string().describe("The user's description of their symptoms."),
  photoDataUri: z
    .string()
    .optional()
    .describe("Optional photo of the symptom as a Base64 data URI."),
  userDetails: UserDetailsSchema.optional(),
});

export type DiagnoseSymptomsInput = z.infer<
  typeof DiagnoseSymptomsInputSchema
>;

/* ---------------- OUTPUT ---------------- */

const DiagnoseSymptomsOutputSchema = z.object({
  riskLevel: z.enum(["Green", "Yellow", "Red"]),
  analysis: z.string(),
  precautions: z.array(z.string()),
  nextAction: z.string(),
  hospitalRequired: z.boolean(),
  specialist: z.string(),
});

export type DiagnoseSymptomsOutput = z.infer<
  typeof DiagnoseSymptomsOutputSchema
>;

/* ---------------- AI FLOW ---------------- */

const diagnoseSymptomsFlow = ai.defineFlow(
  {
    name: "diagnoseSymptomsFlow",
    inputSchema: DiagnoseSymptomsInputSchema,
    outputSchema: DiagnoseSymptomsOutputSchema,
  },
  async (input) => {
    const { userDetails, description, photoDataUri } = input;

    const promptParts: any[] = [
      `
You are a healthcare guidance AI built for a student hackathon project.

If an image is provided, carefully analyze the image for visible symptoms
such as wounds, rashes, swelling, bleeding, injuries, or skin changes.

IMAGE SAFETY RULE (VERY IMPORTANT):
If an image shows any visible rash, skin lesion, wound, redness, swelling,
open skin, or infection signs, the minimum risk level MUST be Yellow.
Do NOT classify such cases as Green.

IMPORTANT SAFETY RULES:
- You are NOT a doctor
- Do NOT give diagnosis or medicines
- Use very simple language
- If unsure, choose Yellow or Red

RISK LEVELS:
Green  → Minor issue, safe home care
Yellow → Moderate issue, doctor visit recommended
Red    → Serious issue, immediate hospital visit

GREEN RULES:
Choose Green ONLY if ALL are true:
- Symptoms are mild
- No severe pain
- No breathing problem
- No bleeding
- No unconsciousness

SPECIALIST RULES:
- Chest pain, heart issues → Cardiologist
- Accident, heavy bleeding → Emergency
- Breathing problems → Pulmonologist
- Fever, cold, stomach pain, skin issues → General Physician

USER DETAILS:
Name: ${userDetails?.name || "Not provided"}
Age: ${userDetails?.age || "Not provided"}
Weight: ${userDetails?.weight || "Not provided"}
Gender: ${userDetails?.gender || "Not provided"}

PROBLEM DESCRIPTION:
"${description}"
      `,
    ];

    if (photoDataUri) {
      promptParts.push({ media: { url: photoDataUri } });
    }

    const llmResponse = await ai.generate({
      prompt: promptParts,
      output: { schema: DiagnoseSymptomsOutputSchema },
      model: "googleai/gemini-2.5-flash",
      config: { temperature: 0.2 },
    });

    if (!llmResponse.output) {
      throw new Error("No response from AI");
    }

    return llmResponse.output;
  }
);

/* ---------------- FALLBACK LOGIC ---------------- */

export async function diagnoseSymptoms(
  input: DiagnoseSymptomsInput
): Promise<DiagnoseSymptomsOutput> {

  const text = input.description?.toLowerCase() || "";
  const hasImage = Boolean(input.photoDataUri);

  let aiResult: DiagnoseSymptomsOutput;

  try {
    aiResult = await diagnoseSymptomsFlow(input);
  } catch (error) {
    console.error("AI failed:", error);
    throw error;
  }

  /* 🔴 ABSOLUTE SAFETY OVERRIDE (IMAGE FIRST) */
  if (
    hasImage &&
    (
      text.includes("bleeding") ||
      text.includes("blood") ||
      text.includes("head") ||
      text.includes("injury") ||
      text.includes("accident") ||
      text.includes("wound")
    )
  ) {
    console.log("🚨 IMAGE SAFETY OVERRIDE → RED");

    return {
      riskLevel: "Red",
      analysis: "Severe injury detected from the image.",
      precautions: [],
      nextAction: "Go to the nearest hospital immediately",
      hospitalRequired: true,
      specialist: "Emergency",
    };
  }

  /* 🟡 IMAGE PRESENT BUT NOT SEVERE → MIN YELLOW */
  if (hasImage && aiResult.riskLevel === "Green") {
    console.log("⚠️ IMAGE PRESENT → MINIMUM YELLOW");

    return {
      ...aiResult,
      riskLevel: "Yellow",
      analysis: "Visible injury detected. Medical attention advised.",
      hospitalRequired: false,
      specialist: aiResult.specialist || "General Physician",
    };
  }

  /* ✅ OTHERWISE TRUST AI */
  return aiResult;
}
