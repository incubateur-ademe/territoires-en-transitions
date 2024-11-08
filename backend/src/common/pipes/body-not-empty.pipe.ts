import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class BodyNotEmptyPipe implements PipeTransform {
  transform(value: any) {
    if (!value || Object.keys(value).length === 0) {
      throw new BadRequestException('Request body cannot be empty');
    }
    return value;
  }
}
