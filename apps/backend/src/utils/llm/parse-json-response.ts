import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z, ZodError, ZodType } from 'zod';
import { LlmError, SchemaIssue } from './llm.errors';

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
    return failure({
      kind: 'invalid_json',
      rawTextLength: text.length,
      schemaIssue: toSchemaIssue(validated.error),
    });
  }

  return success(validated.data);
};

const isJsonPathSegment = (
  segment: PropertyKey
): segment is string | number => typeof segment !== 'symbol';

const toSchemaIssue = (error: ZodError): SchemaIssue | undefined => {
  const [issue] = error.issues;
  if (!issue) {
    return undefined;
  }
  return { path: issue.path.filter(isJsonPathSegment), code: issue.code };
};

const tryParseJson = (text: string): Result<unknown, 'invalid'> => {
  try {
    return success(JSON.parse(text));
  } catch {
    return failure('invalid');
  }
};
