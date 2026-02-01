import { z } from "zod";

import { basicsSchema, defaultBasics } from "./basics";

// Schema
export const resumeDataSchema = z.object({
  basics: basicsSchema,
});

// Type
export type ResumeData = z.infer<typeof resumeDataSchema>;

// Defaults
export const defaultResumeData: ResumeData = {
  basics: defaultBasics,
};

export * from "./basics";
export * from "./shared";
