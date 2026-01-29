import { z } from "zod";

// ============================================
// Auth Schemas
// ============================================

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// ============================================
// Group Schemas
// ============================================

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  memberEmails: z.array(z.string().email()).optional(),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// ============================================
// Expense Schemas
// ============================================

export const createExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  paidById: z.string().min(1, "Payer is required"),
  splitBetweenIds: z
    .array(z.string())
    .min(1, "At least one person must be in the split"),
  groupId: z.string().min(1, "Group is required"),
});

export const updateExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large")
    .optional(),
  paidById: z.string().optional(),
  splitBetweenIds: z.array(z.string()).min(1).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ============================================
// Invite Schema
// ============================================

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
