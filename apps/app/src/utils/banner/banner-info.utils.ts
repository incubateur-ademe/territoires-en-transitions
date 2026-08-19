import type { BannerType } from '@tet/domain/utils';
import { z } from 'zod';

/**
 * Banner types whose semantic meaning is "urgent" — used to pick the right
 * ARIA live region role for screen readers.
 */
export function isUrgentBannerType(type: BannerType): boolean {
  return type === 'error' || type === 'warning';
}

export const BANNER_DISMISSAL_DURATION_MS = 24 * 60 * 60 * 1000;

const bannerDismissalSchema = z.object({
  modifiedAt: z.string(),
  dismissedAt: z.number(),
});

export type BannerDismissal = z.infer<typeof bannerDismissalSchema>;

export function deserializeBannerDismissal(
  stored: string
): BannerDismissal | undefined {
  try {
    const result = bannerDismissalSchema.safeParse(JSON.parse(stored));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function isBannerDismissalActive({
  dismissal,
  modifiedAt,
  now,
}: {
  dismissal: BannerDismissal | undefined;
  modifiedAt: string;
  now: number;
}): boolean {
  if (!dismissal) {
    return false;
  }

  return (
    dismissal.modifiedAt === modifiedAt &&
    now - dismissal.dismissedAt < BANNER_DISMISSAL_DURATION_MS
  );
}
