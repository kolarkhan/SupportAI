import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  companyName: z.string().trim().min(2, "Company name is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const agentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarEmoji: z.string().max(8).optional(),
  brandColor: z.string().max(16).optional(),
  personality: z.enum(["PROFESSIONAL", "FRIENDLY", "CONCISE", "FORMAL", "CUSTOM"]).optional(),
  systemInstructions: z.string().max(4000).optional(),
  provider: z.enum(["MOCK", "OPENAI", "ANTHROPIC"]).optional(),
  answerOnlyFromKnowledgeBase: z.boolean().optional(),
  allowGeneralKnowledge: z.boolean().optional(),
  requireHumanApproval: z.boolean().optional(),
  escalateUncertainQuestions: z.boolean().optional(),
  collectCustomerInfo: z.boolean().optional(),
  askForEmail: z.boolean().optional(),
  askForPhone: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  escalationKeywords: z.string().max(1000).optional(),
  businessHoursStart: z.string().max(8).optional(),
  businessHoursEnd: z.string().max(8).optional(),
  businessTimezone: z.string().max(60).optional(),
  escalationMessage: z.string().max(500).optional(),
  widgetPosition: z.string().max(20).optional(),
  widgetWelcomeMessage: z.string().max(300).optional(),
  widgetSuggested: z.string().max(500).optional(),
  isPublished: z.boolean().optional(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(3, "Question is required").max(500),
  answer: z.string().trim().min(3, "Answer is required").max(3000),
});

export const websiteSchema = z.object({
  url: z.string().trim().url("Enter a valid URL, e.g. https://example.com"),
});

export const chatMessageSchema = z.object({
  agentId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1, "Message cannot be empty").max(4000),
  customerName: z.string().trim().max(100).optional(),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export const teamInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]),
});
