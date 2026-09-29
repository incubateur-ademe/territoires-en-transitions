import * as z from 'zod/mini';

export const nonBlankTextSchema = z.string().check(z.trim(), z.minLength(1));
