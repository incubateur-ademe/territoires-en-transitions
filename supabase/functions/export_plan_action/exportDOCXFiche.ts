/**
 * Export d'une fiche action au format Word
 */

import { Document, Packer } from 'https://esm.sh/docx@8.2.2';
import { fetchDataFiche } from './fetchDataFiche.ts';
import { getHeaders, getFooters, exportFiche } from './exportDOCX.ts';
import { formatDate } from './utils.ts';
import { styles } from './styles.xml.ts';

export const exportDOCXFiche = async (
  supabaseClient: TSupabaseClient,
  ficheId: number
) => {
  // charge les données
  const data = await fetchDataFiche(supabaseClient, ficheId);

  // extrait le titre de la fiche
  const { fiche, actionLabels } = data;
  const { titre } = fiche;

  // nom du fichier cible
  const exportedAt = new Date();
  const filename = `Export_${titre}_${formatDate(
    exportedAt,
    'yyyy-MM-dd'
  )}.docx`;

  // transforme la fiche en document
  const doc = new Document({
    externalStyles: styles,
    titre,
    sections: [
      {
        properties: { titlePage: true },
        headers: getHeaders(titre),
        footers: getFooters(),
        children: exportFiche({ fiche: { fiche } }, data),
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
