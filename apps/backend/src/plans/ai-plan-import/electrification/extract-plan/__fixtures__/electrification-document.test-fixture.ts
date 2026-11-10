import { Document, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import template from './electrification-v4.template.json';

/** Document rempli synthétique ; les libellés viennent du canevas indépendant. */
export async function buildElectrificationDocument({
  fields = {},
  cibleRecharge,
  cibleGaz,
}: {
  fields?: Record<string, string>;
  cibleRecharge?: string;
  cibleGaz?: string;
} = {}): Promise<Buffer> {
  const sections = structuredClone(template.sections);
  const engagements = sections[0].rows;
  engagements[1][2].text = 'Oui';
  engagements[1][3].text = '0';
  if (cibleGaz !== undefined) {
    engagements[2][1].text = 'Oui';
    engagements[2][2].text = cibleGaz;
  }
  if (cibleRecharge !== undefined) {
    engagements[7][2].text = 'Oui';
    engagements[7][3].text = cibleRecharge;
  }
  for (const [label, value] of Object.entries({
    Axe: '1',
    "Intitulé de l'action": 'Action synthétique',
    'Budget prévisionnel en € HT (facultatif)': '1000',
    ...fields,
  })) {
    const row = sections[1].rows.find((row) => row[0].text === label);
    if (!row || row.length < 2) throw new Error(`Champ absent : ${label}`);
    row[1].text = value;
  }
  return Packer.toBuffer(
    new Document({
      sections: [
        {
          children: sections.flatMap(({ heading, rows }) => [
            new Paragraph(heading),
            new Table({
              rows: rows.map(
                (cells) =>
                  new TableRow({
                    children: cells.map(
                      (cell) =>
                        new TableCell({
                          ...cell,
                          children: cell.text
                            .split('\n')
                            .map((text) => new Paragraph(text)),
                        })
                    ),
                  })
              ),
            }),
          ]),
        },
      ],
    })
  );
}
