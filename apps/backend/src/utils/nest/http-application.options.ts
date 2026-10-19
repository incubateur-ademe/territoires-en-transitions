import type { NestApplicationOptions } from '@nestjs/common';

export const httpApplicationOptions = {
  return503OnClosing: true,
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
} satisfies NestApplicationOptions;
