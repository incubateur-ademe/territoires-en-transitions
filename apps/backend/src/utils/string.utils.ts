import slugify from 'slugify';

export function toSlug(s: string): string {
  if (!s) {
    return s;
  }

  return slugify(s.toLowerCase(), {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
  });
}
