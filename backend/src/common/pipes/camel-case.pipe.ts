import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { objectToCamel } from 'ts-case-convert';

@Injectable()
export class CamelCasePipe implements PipeTransform {
  transform(value: any) {
    return objectToCamel(value);
  }
}
