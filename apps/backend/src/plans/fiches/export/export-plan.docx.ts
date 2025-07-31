/**
 * Export d'un plan d'action au format Word
 */
import { Plan, PlanRow } from '@/backend/plans/fiches/plan-actions.service';
import { formatDate } from "@/backend/utils/excel/export-excel.utils";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Tab,
  TabStopPosition,
  TabStopType,
  TextRun
} from 'docx';
import { isNotNil } from 'es-toolkit';
import { SECTIONS } from './sections.js';
import { styles } from './styles.xml.js';

export const exportPlanDOCX = async (plan: Plan) => {
  const title = plan.root.nom || 'Sans titre';
  const sections = getSections(plan);

  // transforme le plan en document
  const doc = new Document({
    externalStyles: styles,
    title,
    sections: [
      {
        properties: { titlePage: true },
        headers: getHeaders(title),
        footers: getFooters(),
        children: plan?.rows?.flatMap((fiche) => getParagraphes(sections, fiche)) || [],
      },
    ],
  });

  return Packer.toBuffer(doc);
};

export const getHeaders = (title: string) => {
  const today = formatDate(new Date());

  return {
    first: new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true }),
            new TextRun({ children: [new Tab(), today || ''] }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
        }),
      ],
    }),
  };
};

export const getFooters = () => ({
  default: new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT] })],
      }),
    ],
  }),
});

// génère la liste des sections/sous-sections à partir des données du plan
const getSections = (plan: Plan) =>
  SECTIONS.map(({ sectionLabel, cols }) => ({
    sectionLabel,
    sousSections: cols(plan).filter((c) => !c.excludeFromDocx),
  }));
type Sections = ReturnType<typeof getSections>;

// génère la liste des paragraphes correspondants à chaque section d'une fiche
const getParagraphes = (sections: Sections, row: PlanRow): Paragraph[] => {
  const { path, depth, nom, fiche } = row;
  if (!fiche) return [];

  const paragraphes: Paragraph[] = [
    new Paragraph({
      children: [new TextRun(fiche.titre || 'Sans titre')],
      style: 'Title',
    }),
    NormalText(depth === 0 ? '(Fiche non classée)' : [...path, nom].join(' > ')),
  ];

  sections.forEach(({sectionLabel, sousSections}) => {
    const sousParagraphes: Paragraph[] = [];

    sousSections.forEach(({colLabel, cellValue, format}) => {
      const value = cellValue(row);
      if (Array.isArray(value)) {
        if (value.length) {
          sousParagraphes.push(Heading2(colLabel), ...Bullets(value))
        }
      } else if (isNotNil(value) && value !== '') {
        sousParagraphes.push(Heading2(colLabel), format === 'euro' ? NormalTextEuro(value as number) : NormalText(value as string));
      }
    })

    if (sousParagraphes.length) {
      paragraphes.push(Heading1(sectionLabel), ...sousParagraphes);
    }
  })

  return paragraphes;
}

const NormalText = (text: string | undefined | null) =>
  text ? new Paragraph({ text }) : NonRenseigne;
const NormalTextEuro = (value: number | undefined | null) =>
  NormalText(formatEuro(value));

const NonRenseigne = new Paragraph({
  children: [new TextRun({ text: 'Non renseigné', color: '999999' })],
});

const currencyFormatter = new Intl.NumberFormat('fr', {
  style: 'currency',
  currency: 'EUR',
});
const formatEuro = (value: number | undefined | null) =>
  value ? currencyFormatter.format(value) : '';

const Heading1 = (text: string) => new Paragraph({ text, style: 'Heading1' });
const Heading2 = (text: string) => new Paragraph({ text, style: 'Heading2' });
const Bullets = (list: string[] | null | undefined, level = 0) => {
  const bullets = list
    ?.filter((text) => !!text)
    .map((text) => new Paragraph({ text, bullet: { level } }));
  return bullets?.length ? bullets : [NonRenseigne];
};
