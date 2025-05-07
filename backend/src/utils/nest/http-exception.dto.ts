import { HttpExceptionBody } from '@nestjs/common';

export interface HttpExceptionDto {
  message: string;
  name: string;
  status: number;

  response?: HttpExceptionBody;
}
