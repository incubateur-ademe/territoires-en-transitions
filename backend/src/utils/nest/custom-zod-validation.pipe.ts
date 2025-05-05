import {
  ZodValidationPipe,
  ZodValidationPipeOptions,
} from '@anatine/zod-nestjs';
import {
  ArgumentMetadata,
  Injectable,
  Logger,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { ContextStoreService } from '../context/context.service';

@Injectable()
export class CustomZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(CustomZodValidationPipe.name);

  private readonly zodValidationPipe: ZodValidationPipe;

  constructor(
    private readonly contextStoreService: ContextStoreService,
    @Optional() options?: ZodValidationPipeOptions
  ) {
    this.zodValidationPipe = new ZodValidationPipe(options);
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
      this.logger.error(
        `Error in Zod validation pipe: ${JSON.stringify(error)}`
      );
      throw error;
    }
  }
}
