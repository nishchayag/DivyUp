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
  currency: z
    .enum(["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"])
    .default("USD"),
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
  currency: z
    .enum(["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"])
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// ============================================
// Expense Schemas
// ============================================

export const createExpenseSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters"),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(1000000, "Amount too large"),
    currency: z
      .enum(["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"])
      .optional(),
    paidById: z.string().min(1, "Payer is required"),
    category: z.string().max(80).optional(),
    notes: z.string().max(2000).optional(),
    splitBetweenIds: z
      .array(z.string())
      .min(1, "At least one person must be in the split"),
    splitMode: z.enum(["equal", "percentage"]).default("equal"),
    splitShares: z
      .array(
        z.object({
          userId: z.string().min(1),
          percentage: z.number().positive().max(100),
        }),
      )
      .optional(),
    recurrence: z
      .object({
        enabled: z.boolean().default(false),
        frequency: z.enum(["weekly", "monthly"]).optional(),
        nextRunAt: z.string().datetime().optional(),
      })
      .optional(),
    groupId: z.string().min(1, "Group is required"),
  })
  .superRefine((data, ctx) => {
    if (data.splitMode === "percentage") {
      if (!data.splitShares || data.splitShares.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "splitShares is required for percentage split mode",
          path: ["splitShares"],
        });
        return;
      }

      const total = data.splitShares.reduce(
        (sum, share) => sum + share.percentage,
        0,
      );
      if (Math.abs(total - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "splitShares percentages must sum to 100",
          path: ["splitShares"],
        });
      }
    }
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
  currency: z
    .enum(["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"])
    .optional(),
  paidById: z.string().optional(),
  splitBetweenIds: z.array(z.string()).min(1).optional(),
  category: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  splitMode: z.enum(["equal", "percentage"]).optional(),
  splitShares: z
    .array(
      z.object({
        userId: z.string().min(1),
        percentage: z.number().positive().max(100),
      }),
    )
    .optional(),
  status: z.enum(["open", "settled"]).optional(),
  recurrence: z
    .object({
      enabled: z.boolean().default(false),
      frequency: z.enum(["weekly", "monthly"]).optional(),
      nextRunAt: z.string().datetime().optional(),
    })
    .optional(),
});

export const expenseCommentSchema = z.object({
  text: z.string().min(1, "Comment is required").max(1000),
});

export type ExpenseCommentInput = z.infer<typeof expenseCommentSchema>;

export const expensePaymentSchema = z.object({
  amount: z.number().positive().max(1000000),
  note: z.string().max(300).optional(),
});

export type ExpensePaymentInput = z.infer<typeof expensePaymentSchema>;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ============================================
// Invite Schema
// ============================================

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// ============================================
// Feedback & Profile Schemas
// ============================================

export const feedbackSchema = z.object({
  message: z
    .string()
    .min(5, "Feedback must be at least 5 characters")
    .max(2000, "Feedback must be less than 2000 characters"),
  page: z.string().max(200).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  image: z.string().url("Profile image must be a valid URL").optional(),
});
