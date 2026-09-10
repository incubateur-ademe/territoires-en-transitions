const MAX_SEGMENT_BYTES = 255;

const WINDOWS_RESERVED_NAMES = new Set<string>([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

const SEPARATOR_CODEPOINTS = new Set<number>([0x2f, 0x5c]);

function stripControlAndSeparators(input: string): string {
  return Array.from(input)
    .flatMap((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      if (codePoint <= 0x1f || codePoint === 0x7f) {
        return [];
      }
      return [SEPARATOR_CODEPOINTS.has(codePoint) ? '_' : char];
    })
    .join('');
}

function truncateToBytes(value: string, maxBytes: number): string {
  let result = value;
  while (Buffer.byteLength(result, 'utf8') > maxBytes && result.length > 0) {
    result = result.slice(0, -1);
  }
  return result;
}

function truncateSegment(segment: string): string {
  if (Buffer.byteLength(segment, 'utf8') <= MAX_SEGMENT_BYTES) {
    return segment;
  }
  const lastDot = segment.lastIndexOf('.');
  if (lastDot <= 0) {
    return truncateToBytes(segment, MAX_SEGMENT_BYTES);
  }
  const extension = segment.slice(lastDot);
  const extensionBytes = Buffer.byteLength(extension, 'utf8');
  if (extensionBytes >= MAX_SEGMENT_BYTES) {
    return truncateToBytes(segment, MAX_SEGMENT_BYTES);
  }
  const name = segment.slice(0, lastDot);
  return truncateToBytes(name, MAX_SEGMENT_BYTES - extensionBytes) + extension;
}

export function sanitizeSegment(raw: string): string {
  let segment = stripControlAndSeparators(raw.normalize('NFC'));
  segment = segment.trim();
  // Points et espaces de fin : problématiques sous Windows.
  segment = segment.replace(/[. ]+$/, '');

  if (segment === '' || segment === '.' || segment === '..') {
    return '_';
  }

  const baseName = (segment.split('.')[0] ?? '').toLowerCase();
  if (WINDOWS_RESERVED_NAMES.has(baseName)) {
    segment = `_${segment}`;
  }

  return truncateSegment(segment);
}

export function buildArchivePath(segments: string[]): string {
  if (segments.length === 0) {
    throw new Error('buildArchivePath: au moins un segment est requis');
  }
  return segments.map(sanitizeSegment).join('/');
}
