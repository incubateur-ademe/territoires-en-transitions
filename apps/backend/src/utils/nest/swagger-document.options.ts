import type { SwaggerDocumentOptions } from '@nestjs/swagger';
import { z } from 'zod';

export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  standardSchemaConverter: (schema, { schemaType }) => {
    if (!(schema instanceof z.core.$ZodType)) {
      return undefined;
    }

    const { id, $defs, definitions, ...definition } = z.toJSONSchema(schema, {
      target: 'openapi-3.0',
      io: schemaType,
    });

    const components = {
      ...$defs,
      ...(definitions && typeof definitions === 'object' ? definitions : {}),
    };
    return id
      ? {
          schema: { $ref: `#/components/schemas/${id}` },
          components: { ...components, [id]: definition },
        }
      : { schema: definition, components };
  },
};
