import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { Reflector } from '@nestjs/core';

export const ApiUsage = Reflector.createDecorator<ApiUsageEnum[]>();
