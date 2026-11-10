import {
  Bookmark,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';

export const CONVENTION_FICHE_URL =
  'https://document.example.test/collectivite/42/fiches/101';
export const CONVENTION_INDICATEUR_URL =
  'https://document.example.test/collectivite/42/indicateurs/202';
export const CONVENTION_SOURCE_URL = 'https://document.example.test/source';

/** Convention synthétique : engagements, fiche remplie, modèle vide et budget. */
export const buildTestConvention = (): Promise<Buffer> => {
  const cell = (text: string) =>
    new TableCell({ children: [new Paragraph(text)] });
  const row = (label: string, value: string) =>
    new TableRow({ children: [cell(label), cell(value)] });
  const heading = (text: string) =>
    new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
  const blankLink = (target: string) =>
    new Paragraph({
      children: [
        new ExternalHyperlink({
          link: target,
          children: [new TextRun(' ')],
        }),
      ],
    });

  return Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            blankLink(`${CONVENTION_SOURCE_URL}#preambule`),
            heading('A. Engagements'),
            new Table({ rows: [row('Code', 'Cible'), row('E01', '100')] }),
            heading('B. Fiches action'),
            new Paragraph({
              children: [
                new Bookmark({
                  id: 'fiche-action',
                  children: [new TextRun('Fiche action renseignée')],
                }),
              ],
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              rows: [
                row('Intitulé', 'Électrifier les bâtiments'),
                new TableRow({
                  children: [
                    cell('Liens'),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new ExternalHyperlink({
                              link: CONVENTION_FICHE_URL,
                              children: [new TextRun('Fiche existante')],
                            }),
                            new TextRun(' ; '),
                            new ExternalHyperlink({
                              link: CONVENTION_INDICATEUR_URL,
                              children: [new TextRun('Indicateur associé')],
                            }),
                            new TextRun(` ; ${CONVENTION_SOURCE_URL}`),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            blankLink(`${CONVENTION_SOURCE_URL}#section`),
            new Paragraph({
              text: 'Modèle de fiche à compléter',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({ rows: [row('Intitulé', 'À compléter')] }),
            heading('C. Financement'),
            new Paragraph('Exemple fictif : montant 5000 euros.'),
          ],
        },
      ],
    })
  );
};
