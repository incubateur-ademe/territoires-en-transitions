export const bannerTypeEnumValues = [
  'info',
  'warning',
  'error',
  'event',
] as const;

export type BannerType = (typeof bannerTypeEnumValues)[number];

/** Runtime type guard — pairs with `bannerTypeEnumValues` to narrow unknown
 *  values from form / Select components without an unsafe `as` cast. */
export function isBannerType(value: unknown): value is BannerType {
  return (
    typeof value === 'string' &&
    (bannerTypeEnumValues as readonly string[]).includes(value)
  );
}
