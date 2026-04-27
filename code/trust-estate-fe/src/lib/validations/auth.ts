import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const baseRegisterSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be at most 100 characters'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string().min(1, 'Please confirm your password'),

  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  role: z.enum(
    ['Buyer', 'PropertyOwner', 'Agent', 'PropertyInspector'],
    {
      message: 'Please select a role',
    }
  ),

  acceptTerms: z.literal(true, {
    message: 'You must accept the Terms and Conditions',
  }),
});


// -------------------- REGISTER --------------------
export const registerSchema = baseRegisterSchema
  .merge(
    z.object({
      agencyType: z.enum(['Independent', 'Agency']).optional(),
      agencyName: z.string().max(100).optional(),
      professionalQualifications: z.string().max(1000).optional(),
    })
  )
  .superRefine((data, ctx) => {
    // Password match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }

    // Role-specific validation
    if (data.role === 'Agent') {
      if (!data.agencyType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select an agency type',
          path: ['agencyType'],
        });
      }

      if (
        data.agencyType === 'Agency' &&
        !data.agencyName?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Agency name is required for agency-affiliated agents',
          path: ['agencyName'],
        });
      }
    }
  });

export type RegisterFormData = z.infer<typeof registerSchema>;


// -------------------- FORGOT PASSWORD --------------------
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),

    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;