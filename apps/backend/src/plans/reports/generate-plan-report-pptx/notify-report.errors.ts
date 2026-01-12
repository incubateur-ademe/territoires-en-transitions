import { createEnumObject } from '@tet/domain/utils';

const NotifyReportErrors = [
  'PARSING_NOTIFICATION_DATA_ERROR',
  'USER_NOT_FOUND',
] as const;
export type NotifyReportError = (typeof NotifyReportErrors)[number];

export const NotifyReportErrorEnum = createEnumObject(NotifyReportErrors);
