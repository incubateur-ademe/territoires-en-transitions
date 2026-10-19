import type { NestApplicationOptions } from '@nestjs/common';

export const httpApplicationOptions = {
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
} satisfies NestApplicationOptions;
