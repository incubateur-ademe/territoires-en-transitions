import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { enqueueImportOutputSchema } from './enqueue-import.output';

const jobId = '00000000-0000-4000-8000-000000000001';

describe('enqueueImportOutputSchema', () => {
  it('conserve la réponse attendue par le parcours générique et PCAET', () => {
    const response = enqueueImportOutputSchema.parse({
      profile: 'generic',
      jobId,
      planId: 42,
    });
    const currentClientSchema = z.object({
      jobId: z.string(),
      planId: z.number(),
    });
    expect(currentClientSchema.parse(response)).toEqual({ jobId, planId: 42 });
  });

  it('réserve le plan absent au profil annexe', () => {
    expect(
      enqueueImportOutputSchema.safeParse({
        profile: 'generic',
        jobId,
        planId: null,
      }).success
    ).toBe(false);
    expect(
      enqueueImportOutputSchema.safeParse({
        profile: 'annexe-3-electrification',
        jobId,
        planId: null,
      }).success
    ).toBe(true);
    expect(
      enqueueImportOutputSchema.safeParse({
        profile: 'annexe-3-electrification',
        jobId,
        planId: 42,
      }).success
    ).toBe(false);
  });
});
