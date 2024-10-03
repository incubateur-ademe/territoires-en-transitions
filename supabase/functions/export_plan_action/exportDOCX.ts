/**
 * Export d'un plan d'action au format Word
 */
import {
  AlignmentType,
  Document,
  Header,
  Footer,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Tab,
  TabStopType,
  TabStopPosition,
  TextRun,
} from 'https://esm.sh/docx@8.2.2';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { formatDate } from '../_shared/exportUtils.ts';
import { TExportData, fetchData, getAnnexesLabels } from './fetchData.ts';
import { Financeur, TFicheActionExport } from './types.ts';
import { styles } from './styles.xml.ts';

export const exportDOCX = async (
  supabaseClient: TSupabaseClient,
  planId: number
) => {
  // charge les données
  const data = await fetchData(supabaseClient, planId);

  // extrait la 1ère ligne (titre du plan)
  const { plan } = data;
  const ligne1 = plan.shift();
  if (!ligne1) {
    return;
  }
  const title = ligne1.axe_nom;

  // nom du fichier cible
  const exportedAt = new Date();
  const filename = `Export_${title}_${formatDate(
    exportedAt,
    'yyyy-MM-dd'
  )}.docx`;

  // transforme le plan en document
  const doc = new Document({
    externalStyles: styles,
    title,
    sections: [
      {
        properties: { titlePage: true },
        headers: getHeaders(title),
        footers: getFooters(),
        children: plan?.flatMap((fiche) => exportFiche(fiche, data)),
      },
    ],
  });

  // exporte le fichier modifié
  const buffer = await Packer.toBuffer(doc);
  return {
    buffer,
    filename,
  };
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

export const exportFiche = (
  ficheAction: TFicheActionExport,
  data: TExportData
) => {
  const { axe_path, axe_nom, fiche: ficheObj } = ficheAction;
  const { fiche } = ficheObj || {};
  if (!fiche) return [];

  const { actionLabels, annexes } = data;
  const path =
    axe_path && axe_nom
      ? [...axe_path.slice(1), axe_nom].join(' > ')
      : undefined;

  return [
    new Paragraph({
      children: [new TextRun(fiche.titre || '')],
      style: 'Title',
    }),
    NormalText(path),

    Heading1('Présentation'),
    Heading2('Description de l’action'),
    NormalText(fiche.description),
    Heading2('Thématique'),
    ...BulletsList(fiche.thematiques),
    Heading2('Sous-thématique'),
    ...BulletsList(fiche.sous_thematiques, 'sous_thematique'),

    Heading1('Objectifs et indicateurs'),
    Heading2('Objectifs'),
    NormalText(fiche.objectifs),
    Heading2('Indicateurs liés'),
    ...BulletsList(fiche.indicateurs, 'titre'),
    Heading2('Résultats attendus'),
    ...Bullets(fiche.resultats_attendus),

    Heading1('Acteurs'),
    Heading2('Cibles'),
    ...Bullets(fiche.cibles),
    Heading2('Structure pilote'),
    ...BulletsList(fiche.structures),
    Heading2('Moyens humains et techniques'),
    NormalText(fiche.ressources),
    Heading2('Partenaires'),
    ...BulletsList(fiche.partenaires),
    Heading2('Personne pilote'),
    ...BulletsList(fiche.pilotes),
    Heading2('Direction ou service pilote'),
    ...BulletsList(fiche.services),
    Heading2('Élu·e référent·e'),
    ...BulletsList(fiche.referents),

    Heading1('Modalités de mise en œuvre'),
    Heading2('Budget prévisionnel total'),
    NormalTextEuro(fiche.budget_previsionnel),
    ...FinanceursList(fiche.financeurs),
    Heading2('Financements'),
    NormalText(fiche.financements),
    Heading2('Statut'),
    NormalText(fiche.statut),
    Heading2('Niveau de priorité'),
    NormalText(fiche.niveau_priorite),
    Heading2('Date de début'),
    NormalTextDate(fiche.date_debut),
    ...(fiche.amelioration_continue
      ? [NormalText('Action en amélioration continue, sans date de fin')]
      : [
          Heading2('Date de fin prévisionnelle'),
          NormalTextDate(fiche.date_fin_provisoire),
        ]),
    Heading2('Calendrier'),
    NormalText(fiche.calendrier),

    Heading1('Actions et fiches liées'),
    Heading2('Actions des référentiels liées'),
    ...Bullets(fiche.actions?.map(({ id }) => actionLabels[id])),
    Heading2('Fiches des plans liées'),
    ...BulletsList(fiche.fiches_liees, 'titre'),

    Heading1('Notes complémentaires'),
    NormalText(fiche.notes_complementaires),

    Heading1('Documents et liens'),
    ...Bullets(getAnnexesLabels(annexes, fiche.id)),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

const FinanceursList = (financeurs: Financeur[] | undefined | null) => {
  const result = financeurs?.flatMap(Financeur);
  return result?.length ? result : [Heading2('Financeurs'), NonRenseigne];
};

const Financeur = (financeur: Financeur, index: number) => {
  const { financeur_tag, montant_ttc } = financeur;
  const num = index + 1;
  return [
    Heading2(`Financeur ${num}`),
    NormalText(financeur_tag?.nom),
    Heading2(`Montant engagé financeur ${num}`),
    NormalTextEuro(montant_ttc),
  ];
};

const NormalText = (text: string | undefined | null) =>
  text ? new Paragraph({ text }) : NonRenseigne;
const NormalTextEuro = (value: number | undefined | null) =>
  NormalText(formatEuro(value));
const NormalTextDate = (text: string | undefined | null) =>
  NormalText(formatDate(text));

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

const BulletsList = <
  ArrayOfObj extends Array<Record<string | number | symbol, unknown>>,
  Key extends keyof ArrayOfObj[0]
>(
  items: ArrayOfObj | null | undefined,
  key?: Key
) => {
  const list = items
    ?.map((it) => it[key || 'nom']?.toString() || '')
    .filter(Boolean);
  return Bullets(list);
};
