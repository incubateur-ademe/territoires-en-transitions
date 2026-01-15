type RichTextCell =
  | string
  | {
      richText?: Array<{ text?: string; t?: string }>;
      t?: string;
      r?: Array<{ text?: string; t?: string }>;
    }
  | { r?: Array<{ text?: string; t?: string }>; t?: string }
  | null
  | undefined
  | unknown;

export function extractTextFromRichText(
  value: RichTextCell
): string | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') return value;

  try {
    const v = value as any;
    if (v && Array.isArray(v.richText)) {
      return v.richText.map((seg: any) => seg?.text ?? seg?.t ?? '').join('');
    }
    if (v && Array.isArray(v.r)) {
      return v.r.map((seg: any) => seg?.t ?? seg?.text ?? '').join('');
    }
    if (v && typeof v.t === 'string') {
      return v.t as string;
    }
    if (v && typeof v.w === 'string') {
      return v.w as string;
    }
    return String(v);
  } catch {
    return undefined;
  }
}

export const richTextPreprocessor = (val: unknown) =>
  extractTextFromRichText(val as RichTextCell);
