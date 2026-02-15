import { z } from 'zod';

const mediaTypeSchema = z
  .enum(['IMAGE', 'AUDIO', 'VIDEO', 'image', 'audio', 'video'])
  .transform((v) => v.toUpperCase() as 'IMAGE' | 'AUDIO' | 'VIDEO');

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
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;




