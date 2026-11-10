import { ErrorConfig } from '@tet/backend/utils/trpc/trpc-error-config';

export const planCreationDisabledError = {
  code: 'FORBIDDEN',
  message: 'La création de ce type de plan est temporairement indisponible.',
} satisfies ErrorConfig;
