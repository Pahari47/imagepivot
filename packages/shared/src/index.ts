// Validation schemas
export * from './validation/auth.schema';

// Re-export for easier imports
export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type VerifyEmailInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './validation/auth.schema';

