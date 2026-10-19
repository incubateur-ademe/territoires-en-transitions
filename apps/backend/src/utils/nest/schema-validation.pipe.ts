import {
  ArgumentMetadata,
  BadRequestException,
  Logger,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { ContextStoreService } from '../context/context.service';

export class SchemaValidationPipe extends StandardSchemaValidationPipe {
  private readonly logger = new Logger(SchemaValidationPipe.name);

  constructor(private readonly contextStoreService: ContextStoreService) {
    super({
      exceptionFactory: (issues) =>
        new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: issues,
        }),
    });
  }

  override async transform<T>(
    value: T,
    metadata: ArgumentMetadata
  ): Promise<T> {
    try {
      const transformedValue = await super.transform(value, metadata);
      this.contextStoreService.autoSetContextFromPayload(transformedValue);
      return transformedValue;
    } catch (error) {
      this.logger.log(
        `Error in schema validation pipe: ${JSON.stringify(error)}`
      );
      throw error;
    }
  }
}
