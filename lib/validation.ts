import { z } from "zod";

const steamUrlPattern = /^https:\/\/steamcommunity\.com\/(profiles\/\d{17}|id\/[A-Za-z0-9_-]{2,64})\/?$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumReasonCharacters = 60;
const minimumReasonWords = 10;
const reasonWordPattern = /[A-Za-z0-9']+/g;

function countReasonWords(value: string) {
  return value.match(reasonWordPattern)?.length ?? 0;
}

function isClearlyLowContentReason(value: string) {
  const words = (value.toLowerCase().match(reasonWordPattern) ?? [])
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean);

  const meaningfulWords = words.filter((word) => word.length >= 3);
  const uniqueMeaningfulWords = new Set(meaningfulWords);
  const wordCounts = new Map<string, number>();

  for (const word of meaningfulWords) {
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }

  const highestFrequency = Math.max(0, ...wordCounts.values());

  return (
    meaningfulWords.length < 6 ||
    uniqueMeaningfulWords.size < 6 ||
    highestFrequency >= Math.ceil(meaningfulWords.length / 2)
  );
}

export const whitelistRequestSchema = z.object({
  applicantEmail: z
    .string()
    .trim()
    .toLowerCase()
    .regex(emailPattern, "Enter a valid email address.")
    .max(255, "Email address is too long."),
  steamProfileUrl: z
    .string()
    .trim()
    .url("Enter a valid Steam profile URL.")
    .regex(steamUrlPattern, "Use a Steam community profile URL."),
  reason: z
    .string()
    .trim()
    .min(minimumReasonCharacters, "Tell the admins more. Use at least 60 characters.")
    .max(1200, "Keep your reason under 1200 characters.")
    .refine((value) => countReasonWords(value) >= minimumReasonWords, {
      message: "Tell the admins more. Use at least 10 words.",
    })
    .refine((value) => !isClearlyLowContentReason(value), {
      message: "Give a more specific reason. Brief or repetitive answers are not accepted.",
    }),
});

export const adminDecisionSchema = z.object({
  reviewNote: z
    .string()
    .trim()
    .max(500, "Keep internal notes under 500 characters.")
    .optional()
    .or(z.literal("")),
  applicantMessage: z
    .string()
    .trim()
    .max(500, "Keep applicant message under 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type WhitelistRequestInput = z.infer<typeof whitelistRequestSchema>;
export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;
