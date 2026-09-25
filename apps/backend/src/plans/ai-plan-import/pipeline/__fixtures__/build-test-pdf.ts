/**
 * Écrit un PDF 1.4 minimal, non compressé, pour les tests : du texte en
 * Helvetica posé où on veut, ou une page qui n'est qu'une image JPEG (page
 * « scannée »). Rien à committer en binaire, tout est déterministe.
 */
export type TestPdfPage =
  | {
      kind: 'text';
      /** Lignes posées de haut en bas, une par bloc. */
      blocks: { text: string; x?: number; y?: number; size?: number }[];
    }
  | { kind: 'image'; jpeg: Buffer; width: number; height: number };

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

export const buildTestPdf = (pages: TestPdfPage[]): Buffer => {
  const objects: Buffer[] = [];
  const add = (body: Buffer | string): number => {
    objects.push(Buffer.isBuffer(body) ? body : Buffer.from(body, 'latin1'));
    return objects.length;
  };

  const catalogId = add('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = add(''); // rempli une fois les pages connues
  const fontId = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  );

  const pageIds = pages.map((page) => {
    if (page.kind === 'text') {
      const content = page.blocks
        .map(({ text, x = 50, y = PAGE_HEIGHT - 80, size = 12 }) => {
          const escaped = text.replace(/[\\()]/g, (c) => `\\${c}`);
          return `BT /F1 ${size} Tf ${x} ${y} Td (${escaped}) Tj ET`;
        })
        .join('\n');
      const contentId = add(stream(Buffer.from(content, 'latin1')));
      return add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
      );
    }
    const imageId = add(
      Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
          'latin1'
        ),
        page.jpeg,
        Buffer.from('\nendstream', 'latin1'),
      ])
    );
    const contentId = add(
      stream(
        Buffer.from(
          `q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im1 Do Q`,
          'latin1'
        )
      )
    );
    return add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im1 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
  });

  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(' ')}] /Count ${pageIds.length} >>`,
    'latin1'
  );

  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')];
  const offsets: number[] = [];
  let position = parts[0].length;
  objects.forEach((body, index) => {
    offsets.push(position);
    const object = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, 'latin1'),
      body,
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    parts.push(object);
    position += object.length;
  });
  const xref = [
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`,
    ...offsets.map(
      (offset) => `${String(offset).padStart(10, '0')} 00000 n \n`
    ),
    `trailer\n<< /Size ${
      objects.length + 1
    } /Root ${catalogId} 0 R >>\nstartxref\n${position}\n%%EOF\n`,
  ].join('');
  parts.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(parts);
};

const stream = (content: Buffer): Buffer =>
  Buffer.concat([
    Buffer.from(`<< /Length ${content.length} >>\nstream\n`, 'latin1'),
    content,
    Buffer.from('\nendstream', 'latin1'),
  ]);
