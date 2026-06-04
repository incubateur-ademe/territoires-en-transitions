import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z, ZodType } from 'zod';
import { LlmError } from './llm.errors';

export const parseStructuredResponse = <Schema extends ZodType>(args: {
  completed: boolean;
  text: string | undefined;
  schema: Schema;
}): Result<z.output<Schema>, LlmError> => {
  const { completed, text, schema } = args;

  if (!completed) {
    return failure({ kind: 'truncated' });
  }

  if (!text) {
    return failure({ kind: 'invalid_json', rawTextLength: 0 });
  }

  const parsed = tryParseJson(text);
  if (!parsed.success) {
    return failure({ kind: 'invalid_json', rawTextLength: text.length });
  }

  const validated = schema.safeParse(parsed.data);
  if (!validated.success) {
    return failure({ kind: 'invalid_json', rawTextLength: text.length });
  }

  return success(validated.data);
};

const tryParseJson = (text: string): Result<unknown, 'invalid'> => {
  try {
    return success(JSON.parse(text));
  } catch {
    return failure('invalid');
  }
};
