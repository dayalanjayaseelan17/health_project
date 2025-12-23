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
  description: z.string().optional(),
  photoDataUri: z.string().optional(),
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
    const { description = "", photoDataUri, userDetails } = input;

    const promptParts: any[] = [
      {
        text: `
You are a healthcare guidance AI built for a student hackathon project.

IMPORTANT RULES:
- You are NOT a doctor
- Do NOT give medical diagnosis
- Do NOT prescribe medicines
- Use simple language for rural users
- If unsure, choose Yellow or Red

RISK LEVEL RULE:
If an image shows wounds, rashes, swelling, bleeding, or infection,
the minimum risk MUST be Yellow.

OUTPUT FORMAT (STRICT JSON):
{
  riskLevel: "Green" | "Yellow" | "Red",
  analysis: string,
  precautions: string[],
  nextAction: string,
  hospitalRequired: boolean
}

USER DETAILS:
Name: ${userDetails?.name || "Not provided"}
Age: ${userDetails?.age || "Not provided"}
Weight: ${userDetails?.weight || "Not provided"}
Gender: ${userDetails?.gender || "Not provided"}

PROBLEM DESCRIPTION:
"${description}"
        `,
      },
    ];

    if (photoDataUri) {
      promptParts.push({
        media: { url: photoDataUri },
      });
    }

    const response = await ai.generate({
      prompt: promptParts,
      output: { schema: DiagnoseSymptomsOutputSchema },
      model: "googleai/gemini-2.5-flash",
      config: { temperature: 0.2 },
    });

    if (!response.output) {
      throw new Error("No response from AI");
    }

    const output = response.output;

    // Enforce safety rules
    if (output.riskLevel === "Green") {
      output.nextAction = "Continue home care and monitor";
      output.hospitalRequired = false;
    }

    if (output.riskLevel === "Yellow") {
      output.nextAction = "Visit a nearby doctor or hospital if needed";
      output.hospitalRequired = false;
    }

    if (output.riskLevel === "Red") {
      output.nextAction = "Go to the nearest hospital immediately";
      output.hospitalRequired = true;
      output.precautions = [];
    }

    return output;
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
      };
    }

    return await diagnoseSymptomsFlow(input);
  } catch (error) {
    console.error("AI failed, using fallback:", error);

    const text = (input.description || "").toLowerCase();

    const redFlags = [
      "chest pain",
      "difficulty breathing",
      "unconscious",
      "heavy bleeding",
      "accident",
      "poison",
      "seizure",
    ];

    if (redFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Red",
        analysis: "This problem looks serious.",
        precautions: [],
        nextAction: "Go to the nearest hospital immediately",
        hospitalRequired: true,
      };
    }

    return {
      riskLevel: "Yellow",
      analysis: "Medical attention may be needed.",
      precautions: ["Consult a doctor if symptoms worsen"],
      nextAction: "Visit a nearby doctor or hospital if needed",
      hospitalRequired: false,
    };
  }
}
