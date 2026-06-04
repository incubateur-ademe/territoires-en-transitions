import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseStructuredResponse } from './parse-json-response';

const schema = z.object({ titre: z.string(), score: z.number() });
const validPayload = { titre: 'Action', score: 42 };
const validText = JSON.stringify(validPayload);

describe('parseStructuredResponse', () => {
  it('retourne success quand la complétion est terminée et le JSON conforme', () => {
    const result = parseStructuredResponse({
      completed: true,
      text: validText,
      schema,
    });
    expect(result).toEqual({ success: true, data: validPayload });
  });

  it('ne parse jamais et renvoie truncated quand la complétion est incomplète', () => {
    const result = parseStructuredResponse({
      completed: false,
      text: validText,
      schema,
    });
    expect(result).toEqual({ success: false, error: { kind: 'truncated' } });
  });

  it('renvoie invalid_json quand le texte est vide malgré une complétion terminée', () => {
    const result = parseStructuredResponse({
      completed: true,
      text: '',
      schema,
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'invalid_json', rawTextLength: 0 },
    });
  });

  it('renvoie invalid_json quand le texte n est pas du JSON', () => {
    const text = 'pas du json {';
    const result = parseStructuredResponse({
      completed: true,
      text,
      schema,
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'invalid_json', rawTextLength: text.length },
    });
  });

  it('renvoie invalid_json quand le JSON ne respecte pas le schema', () => {
    const text = JSON.stringify({ titre: 'Action', score: 'pas un nombre' });
    const result = parseStructuredResponse({
      completed: true,
      text,
      schema,
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'invalid_json', rawTextLength: text.length },
    });
  });
});
