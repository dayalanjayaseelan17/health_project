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
  analysis: z.string().describe("Short, simple explanation in one sentence."),
  precautions: z.array(z.string()).describe("Simple home care steps."),
  nextAction: z.string().describe("What the user should do next."),
  hospitalRequired: z.boolean().describe("True only if hospital visit is required."),
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

    const llmResponse = await ai.generate({
      prompt: `
You are a healthcare guidance AI built for a student hackathon project.

IMPORTANT SAFETY RULES:
- You are NOT a doctor.
- You must NOT give medical diagnosis.
- You must NOT prescribe medicines.
- Use very simple language for rural users.
- If unsure, choose Yellow or Red.

TASK:
Classify the health problem into ONE category:

GREEN:
- Minor issue
- Safe home care

YELLOW:
- Moderate issue
- Doctor or hospital visit recommended if needed

RED:
- Serious or emergency
- Immediate hospital visit required

Based on the user's problem, provide a risk assessment.

USER DETAILS:
Name: ${userDetails?.name || "Not provided"}
Age: ${userDetails?.age || "Not provided"}
Weight: ${userDetails?.weight || "Not provided"}
Gender: ${userDetails?.gender || "Not provided"}

PROBLEM DESCRIPTION:
"${description}"
${photoDataUri ? `PHOTO: {{media url="${photoDataUri}"}}` : ''}
`,
      output: {
        schema: DiagnoseSymptomsOutputSchema,
        format: 'json',
      },
      model: "googleai/gemini-2.5-flash",
      config: {
        temperature: 0.2,
      },
    });

    if (!llmResponse.output) {
      throw new Error("No response from AI");
    }

    const output = llmResponse.output;

    // Post-processing to ensure rules are followed
    if (output.riskLevel === "Green") {
        output.nextAction = "Continue home care and monitor";
        output.hospitalRequired = false;
    } else if (output.riskLevel === "Yellow") {
        output.nextAction = "Visit a nearby doctor or hospital if needed";
        output.hospitalRequired = false;
    } else if (output.riskLevel === "Red") {
        output.nextAction = "Go to the nearest hospital immediately";
        output.hospitalRequired = true;
        output.precautions = []; // No precautions for Red
    }


    return output;
  }
);

/* ---------------- FALLBACK ---------------- */

export async function diagnoseSymptoms(
  input: DiagnoseSymptomsInput
): Promise<DiagnoseSymptomsOutput> {
  try {
    if (!input.description && !input.photoDataUri) {
      return {
        riskLevel: "Yellow",
        analysis: "Not enough information provided.",
        precautions: ["Describe the problem clearly", "Upload a photo if possible"],
        nextAction: "Visit a nearby doctor or hospital if needed",
        hospitalRequired: false,
      };
    }

    return await diagnoseSymptomsFlow(input);
  } catch (error) {
    console.error("AI failed, using fallback:", error);

    const text = input.description.toLowerCase();

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
      analysis: "This problem needs attention.",
      precautions: [
        "Take rest",
        "Drink enough water",
        "Avoid heavy work",
      ],
      nextAction: "Visit a nearby doctor or hospital if needed",
      hospitalRequired: false,
    };
  }
}
