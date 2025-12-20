'use server';

import { ai } from "@/ai/genkit";
import { z } from "zod";

const UserDetailsSchema = z.object({
  name: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  gender: z.string().optional(),
});

const DiagnoseSymptomsInputSchema = z.object({
  description: z.string().describe("The user's description of their symptoms."),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of the symptom, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userDetails: UserDetailsSchema.optional().describe("Basic details about the user."),
});

export type DiagnoseSymptomsInput = z.infer<typeof DiagnoseSymptomsInputSchema>;

const DiagnoseSymptomsOutputSchema = z.object({
  riskLevel: z
    .enum(["Green", "Yellow", "Red"])
    .describe(
      "The assessed risk level. Green: Minor, home care is fine. Yellow: Caution, hospital visit recommended. Red: Emergency, immediate hospital visit required."
    ),
  analysis: z
    .string()
    .describe(
      "A brief, simple, one-sentence analysis of the situation for the user."
    ),
  guidance: z
    .string()
    .describe(
      "Simple, clear guidance for the user based on the risk level. Use simple language suitable for low digital literacy."
    ),
});

export type DiagnoseSymptomsOutput = z.infer<typeof DiagnoseSymptomsOutputSchema>;

const diagnoseSymptomsFlow = ai.defineFlow(
  {
    name: "diagnoseSymptomsFlow",
    inputSchema: DiagnoseSymptomsInputSchema,
    outputSchema: DiagnoseSymptomsOutputSchema,
  },
  async (input) => {
    const { userDetails, description, photoDataUri } = input;

    const promptParts: any[] = [
      `You are an AI health assistant for a hackathon project called 'Swasthya Margdarshan'. Your purpose is to provide simple, initial guidance for users in rural areas with low digital literacy. You are NOT a doctor and must NOT give a medical diagnosis.

      Analyze the user's symptoms and determine a risk level (Green, Yellow, or Red).
      - Green: Minor problem, can be treated at home.
      - Yellow: Caution, a hospital visit is recommended.
      - Red: Emergency, an immediate hospital visit is required.

      Use simple, non-technical language. The user's life could be at risk, so be cautious and prioritize safety. If in any doubt, escalate to Yellow or Red.

      User Details:
      - Name: ${userDetails?.name || "Not provided"}
      - Age: ${userDetails?.age || "Not provided"}
      - Weight: ${userDetails?.weight || "Not provided"}
      - Gender: ${userDetails?.gender || "Not provided"}

      Problem Description:
      "${description}"
      `,
    ];

    if (photoDataUri) {
      promptParts.push({ media: { url: photoDataUri } });
    }

    const llmResponse = await ai.generate({
      prompt: promptParts,
      output: {
        schema: DiagnoseSymptomsOutputSchema,
      },
      model: "googleai/gemini-2.5-flash", // Using a model that supports images
      config: {
        temperature: 0.2, // Lower temperature for more deterministic, safer responses
      },
    });

    const output = llmResponse.output;

    if (!output) {
      throw new Error("Failed to get a response from the model.");
    }
    
    // Override guidance text to be standardized and simple
    switch (output.riskLevel) {
        case 'Green':
            output.guidance = "This problem looks minor. You can take rest and basic care at home.";
            break;
        case 'Yellow':
            output.guidance = "This problem needs attention. Please visit a hospital if possible.";
            break;
        case 'Red':
            output.guidance = "This is serious. Please go to the nearest hospital immediately.";
            break;
    }


    return output;
  }
);

export async function diagnoseSymptoms(
  input: DiagnoseSymptomsInput
): Promise<DiagnoseSymptomsOutput> {
    // Fallback logic
    try {
        if (!input.description && !input.photoDataUri) {
            return {
                riskLevel: "Yellow",
                analysis: "Not enough information provided.",
                guidance: "Please describe your problem or upload a photo to get guidance.",
            };
        }
        return await diagnoseSymptomsFlow(input);
    } catch (error) {
        console.error("AI diagnosis failed, using fallback logic:", error);
        const description = input.description.toLowerCase();
        
        const redFlags = ["chest pain", "breathing", "unconscious", "bleeding", "severe pain", "accident", "emergency", "heart attack", "poison"];
        const yellowFlags = ["fever", "headache", "vomiting", "stomach", "pain", "swelling", "rash"];

        if (redFlags.some(flag => description.includes(flag))) {
            return {
                riskLevel: "Red",
                analysis: "Your description contains serious keywords.",
                guidance: "This is serious. Please go to the nearest hospital immediately.",
            };
        }

        if (yellowFlags.some(flag => description.includes(flag))) {
            return {
                riskLevel: "Yellow",
                analysis: "Your symptoms need attention.",
                guidance: "This problem needs attention. Please visit a hospital if possible.",
            };
        }

        return {
            riskLevel: "Green",
            analysis: "Based on your description, the issue seems minor.",
            guidance: "This problem looks minor. You can take rest and basic care at home.",
        };
    }
}
