import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { convertObjectKeysToCamelCase } from '../services/key-converter.helper';

@Injectable()
export class CamelCasePipe implements PipeTransform {
  transform(value: any) {
    return convertObjectKeysToCamelCase(value);
  }
}
