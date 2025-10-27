import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ContextStoreService } from '../context/context.service';

export class CustomZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(CustomZodValidationPipe.name);

  private readonly zodValidationPipe: PipeTransform;

  constructor(private readonly contextStoreService: ContextStoreService) {
    const ZodValidationPipeClass = createZodValidationPipe();
    this.zodValidationPipe = new ZodValidationPipeClass();
  }

  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    try {
      const transformedValue = this.zodValidationPipe.transform(
        value,
        metadata
      );

      if (transformedValue) {
        this.contextStoreService.autoSetContextFromPayload(transformedValue);
      }

      return transformedValue;
    } catch (error) {
      this.logger.log(`Error in Zod validation pipe: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
