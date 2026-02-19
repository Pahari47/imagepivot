import { z } from 'zod';

const mediaTypeSchema = z
  .enum(['IMAGE', 'AUDIO', 'VIDEO', 'image', 'audio', 'video'])
  .transform((v) => v.toUpperCase() as 'IMAGE' | 'AUDIO' | 'VIDEO');

const resizeParamsSchema = z
  .object({
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
    maintainAspect: z.boolean().default(true),
    format: z.enum(['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp']).optional(),
    quality: z.number().int().min(1).max(100).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.width && !val.height) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of width or height must be provided',
        path: ['width'],
      });
    }
  });

const compressParamsSchema = z.object({
  quality: z.number().int().min(1).max(100).optional(),
  format: z.enum(['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp']).optional(),
  optimize: z.boolean().default(true),
});

export const createJobSchema = z
  .object({
    orgId: z.string().min(1),
    featureSlug: z.string().min(1),
    mediaType: mediaTypeSchema.optional(),
    input: z.object({
      key: z.string().min(1),
      sizeBytes: z.number().int().positive().optional(),
      sizeMb: z.number().positive().optional(),
      mimeType: z.string().min(1),
    }),
    params: z.record(z.string(), z.unknown()).default({}),
    utmSource: z.string().min(1).optional(),
    utmCampaign: z.string().min(1).optional(),
    priority: z.number().int().min(0).max(10).default(5),
    maxAttempts: z.number().int().min(1).max(10).default(3),
  })
  .superRefine((val, ctx) => {
    if (!val.input.sizeBytes && !val.input.sizeMb) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'input.sizeBytes or input.sizeMb is required',
        path: ['input', 'sizeBytes'],
      });
    }

    if (val.featureSlug === 'image.resize') {
      const paramsResult = resizeParamsSchema.safeParse(val.params);
      if (!paramsResult.success) {
        paramsResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ['params', ...issue.path],
          });
        });
      }
    }

    if (val.featureSlug === 'image.compress') {
      const paramsResult = compressParamsSchema.safeParse(val.params);
      if (!paramsResult.success) {
        paramsResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ['params', ...issue.path],
          });
        });
      }
    }
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;




