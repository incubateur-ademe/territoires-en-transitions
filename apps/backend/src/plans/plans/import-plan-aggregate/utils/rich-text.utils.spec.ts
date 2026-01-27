import { describe, expect, it } from 'vitest';
import { extractTextFromRichText } from './rich-text.utils';

describe('extractTextFromRichText', () => {
  it('returns string as-is', () => {
    expect(extractTextFromRichText('Hello')).toBe('Hello');
  });

  it('extracts from richText array (modern format)', () => {
    const value = {
      richText: [
        { text: 'Hello ' },
        { text: 'World' },
      ],
    };
    expect(extractTextFromRichText(value)).toBe('Hello World');
  });

  it('extracts from r array (xlsx classic format)', () => {
    const value = {
      r: [
        { t: 'Hello ' },
        { t: 'World' },
      ],
    };
    expect(extractTextFromRichText(value)).toBe('Hello World');
  });

  it('extracts from t property', () => {
    const value = { t: 'Hello' };
    expect(extractTextFromRichText(value)).toBe('Hello');
  });

  it('returns undefined for null/undefined', () => {
    expect(extractTextFromRichText(null as any)).toBeUndefined();
    expect(extractTextFromRichText(undefined as any)).toBeUndefined();
  });

  it('falls back to String(value) when unknown object', () => {
    const value = { any: 42 } as any;
    expect(extractTextFromRichText(value)).toBe('[object Object]');
  });
});


