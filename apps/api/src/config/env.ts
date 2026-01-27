import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  HOST: z.string().default('localhost'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // OAuth - Facebook
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().url().optional(),

  // Frontend URLs
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  // Email (for password reset, verification)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Request origin detection (for role assignment)
  ADMIN_FRONTEND_ORIGIN: z.string().url().default('http://localhost:3001'),

  // Cloudflare R2 / S3 Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('imagepivot-uploads'),
  R2_PUBLIC_URL: z.string().url().optional(), // Public URL for R2 bucket
  R2_ENDPOINT: z.string().url().optional(), // R2 endpoint URL
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:');
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        console.error(`  ${path}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = loadEnv();

