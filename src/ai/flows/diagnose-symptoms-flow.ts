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

IMPORTANT SAFETY RULES:
- You are NOT a doctor
- Do NOT give diagnosis or medicines
- Use very simple language
- If unsure, choose Yellow or Red

RISK LEVELS:
Green  → Minor issue, home care
Yellow → Moderate issue, doctor visit recommended
Red    → Serious issue, immediate hospital visit

GREEN RULES:
Choose Green ONLY if:
- Symptoms are mild
- No severe pain
- No breathing problem
- No bleeding
- No unconsciousness

SPECIALIST RULES:
- Chest pain, heart issues → Cardiologist
- Accident, heavy bleeding → Emergency
- Breathing problems → Pulmonologist
- Fever, cold, stomach pain → General Physician

USER DETAILS:
Name: ${userDetails?.name || "Not provided"}
Age: ${userDetails?.age || "Not provided"}
Weight: ${userDetails?.weight || "Not provided"}
Gender: ${userDetails?.gender || "Not provided"}

PROBLEM:
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
  try {
    if (!input.description && !input.photoDataUri) {
      return {
        riskLevel: "Yellow",
        analysis: "Not enough information provided.",
        precautions: [
          "Describe the problem clearly",
          "Upload a photo if possible",
        ],
        nextAction: "Visit a nearby doctor or hospital if needed",
        hospitalRequired: false,
        specialist: "General Physician",
      };
    }

    return await diagnoseSymptomsFlow(input);

  } catch (error) {
    console.error("AI failed, using fallback:", error);

    const text = input.description.toLowerCase();

    /* 🔴 RED CASES */
    if (text.includes("chest pain") || text.includes("heart")) {
      return {
        riskLevel: "Red",
        analysis: "Chest or heart problem detected.",
        precautions: [],
        nextAction: "Go to the nearest hospital immediately",
        hospitalRequired: true,
        specialist: "Cardiologist",
      };
    }

    if (text.includes("accident") || text.includes("bleeding")) {
      return {
        riskLevel: "Red",
        analysis: "Accident or heavy bleeding detected.",
        precautions: [],
        nextAction: "Go to the nearest hospital immediately",
        hospitalRequired: true,
        specialist: "Emergency",
      };
    }

    if (text.includes("breathing") || text.includes("asthma")) {
      return {
        riskLevel: "Red",
        analysis: "Breathing problem detected.",
        precautions: [],
        nextAction: "Go to the nearest hospital immediately",
        hospitalRequired: true,
        specialist: "Pulmonologist",
      };
    }

    /* 🟡 YELLOW CASES */
    const yellowFlags = [
      "fever",
      "vomiting",
      "diarrhea",
      "stomach pain",
      "infection",
      "body pain",
      "swelling",
      "headache for",
    ];

    if (yellowFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Yellow",
        analysis: "This problem needs medical attention.",
        precautions: [
          "Take rest",
          "Drink enough water",
          "Avoid heavy work",
        ],
        nextAction: "Visit a nearby doctor or hospital if needed",
        hospitalRequired: false,
        specialist: "General Physician",
      };
    }

    /* 🟢 GREEN CASE (DEFAULT) */
    return {
      riskLevel: "Green",
      analysis: "This problem appears to be minor.",
      precautions: [
        "Take rest",
        "Drink enough water",
        "Avoid heavy work",
      ],
      nextAction: "Continue home care and monitor",
      hospitalRequired: false,
      specialist: "General Physician",
    };
  }
}
