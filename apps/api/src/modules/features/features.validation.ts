import { z } from 'zod';

export const getFeaturesQuerySchema = z.object({
  mediaType: z.enum(['IMAGE', 'AUDIO', 'VIDEO', 'image', 'audio', 'video']).optional().transform((v) => {
    if (!v) return undefined;
    return v.toUpperCase() as 'IMAGE' | 'AUDIO' | 'VIDEO';
  }),
});

export type GetFeaturesQuery = z.infer<typeof getFeaturesQuerySchema>;


