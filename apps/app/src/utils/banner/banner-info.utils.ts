import type { BannerType } from '@tet/domain/utils';

/**
 * Banner types whose semantic meaning is "urgent" — used to pick the right
 * ARIA live region role for screen readers.
 */
export function isUrgentBannerType(type: BannerType): boolean {
  return type === 'error' || type === 'warning';
}
