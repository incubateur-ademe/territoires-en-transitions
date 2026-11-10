import { Document, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import template from './electrification-v4.template.json';

/** Document rempli synthétique ; les libellés viennent du canevas indépendant. */
export async function buildElectrificationDocument({
  fields = {},
  engagements,
  cibleRecharge,
  cibleGaz,
  indicateurs = [],
  sousActions = [],
}: {
  fields?: Record<string, string>;
  engagements?: { libelle: string; cible?: string }[];
  cibleRecharge?: string;
  cibleGaz?: string;
  indicateurs?: {
    titre: string;
    resultat: string;
    objectif?: string;
    reference?: string;
  }[];
  sousActions?: { titre: string; dateFin: string }[];
} = {}): Promise<Buffer> {
  const sections = structuredClone(template.sections);
  const engagementRows = sections[0].rows;
  const selectedEngagements = engagements ?? [
    { libelle: engagementRows[1][1].text, cible: '0' },
  ];
  for (const { libelle, cible = '' } of selectedEngagements) {
    const row = engagementRows.find((cells) =>
      cells.some(({ text }) => text === libelle)
    );
    if (!row) throw new Error(`Engagement absent : ${libelle}`);
    row[row.length - 2].text = 'Oui';
    row[row.length - 1].text = cible;
  }
  if (cibleGaz !== undefined) {
    engagementRows[2][1].text = 'Oui';
    engagementRows[2][2].text = cibleGaz;
  }
  if (cibleRecharge !== undefined) {
    engagementRows[7][2].text = 'Oui';
    engagementRows[7][3].text = cibleRecharge;
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
  for (const { heading, values } of [
    {
      heading: 'Sous-actions (facultatif)',
      values: sousActions.map(({ titre, dateFin }) => [titre, dateFin]),
    },
    {
      heading: 'Indicateurs de suivi',
      values: indicateurs.map(
        ({ reference = '', titre, resultat, objectif = '' }) => [
          reference,
          titre,
          resultat,
          objectif,
        ]
      ),
    },
  ]) {
    const rows = sections[1].rows;
    const placeholderIndex =
      rows.findIndex((row) => row[0].text === heading) + 2;
    const placeholder = rows[placeholderIndex];
    rows.splice(
      placeholderIndex,
      0,
      ...values.map((value) =>
        placeholder.map((cell, index) => ({ ...cell, text: value[index] }))
      )
    );
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
