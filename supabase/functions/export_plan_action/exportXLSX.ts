/**
 * Export d'un plan d'action au format Excel
 */
import { Workbook, Worksheet } from 'https://esm.sh/exceljs@4.3.0';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { formatDate, setEuroValue } from '../_shared/exportUtils.ts';
import { ConfigPlanAction } from './config.ts';
import { TExportData, fetchData, getAnnexesLabels } from './fetchData.ts';
import { fetchTemplate } from './fetchTemplate.ts';

// insère les données dans le modèle et sauvegarde le fichier xlsx en résultant
export const exportXLSX = async (
  supabaseClient: TSupabaseClient,
  planId: number
) => {
  // charge les données et le template de fichier
  const data = await fetchData(supabaseClient, planId);
  const template = await fetchTemplate('export_plan_action.xlsx');

  // extrait la 1ère ligne (titre du plan)
  const { plan } = data;
  const ligne1 = plan.shift();
  if (!ligne1) {
    return;
  }
  const titre = ligne1.axe_nom;

  // ouvre le classeur et sélectionne la première feuille de calcul
  const workbook = new Workbook();
  await workbook.xlsx.load(template);
  const worksheet = workbook.worksheets[0];

  // nom du fichier cible
  const exportedAt = new Date();
  const filename = `Export_${titre}_${formatDate(
    exportedAt,
    'yyyy-MM-dd'
  )}.xlsx`;

  // écrit le plan dans la feuille
  exportPlan(worksheet, data);

  // exporte le fichier modifié
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename,
  };
};

const exportPlan = (
  // feuille de calcul dans laquelle écrire
  worksheet: Worksheet,
  // données de l'export
  data: TExportData
) => {
  const { actionLabels, annexes, plan } = data || {};
  const { data_cols, first_data_row } = ConfigPlanAction;

  // numéro de la ligne à partir de laquelle écrire
  let ligne_courante = first_data_row;

  // parcours les fiches
  plan?.forEach(({ axe_path, axe_nom, fiche: ficheObj }) => {
    const { fiche } = ficheObj || {};

    // chemin dans le plan
    const path = [...axe_path.slice(1), axe_nom];
    worksheet.getCell(data_cols.nom_axe + ligne_courante).value = path[0];
    worksheet.getCell(data_cols.sous_axe1 + ligne_courante).value = path[1];
    worksheet.getCell(data_cols.sous_axe2 + ligne_courante).value = path[2];

    if (fiche) {
      // pour que la hauteur de chaque ligne soit ajustée à son contenu
      worksheet.getRow(ligne_courante).height = undefined!;

      // Présentation de l’action
      worksheet.getCell(data_cols.titre + ligne_courante).value = fiche.titre;
      worksheet.getCell(data_cols.description + ligne_courante).value =
        fiche.description;
      worksheet.getCell(data_cols.thematiques + ligne_courante).value =
        joinNames(fiche.thematiques);
      worksheet.getCell(data_cols.sous_thematiques + ligne_courante).value =
        fiche.sous_thematiques
          ?.map(({ sous_thematique }) => sous_thematique)
          .join(',');

      // Objectifs et indicateurs
      worksheet.getCell(data_cols.objectifs + ligne_courante).value =
        fiche.objectifs;
      worksheet.getCell(data_cols.indicateurs + ligne_courante).value =
        joinTitres(fiche.indicateurs);
      worksheet.getCell(data_cols.resultats_attendus + ligne_courante).value =
        fiche.resultats_attendus?.join(', ');

      // Acteurs
      worksheet.getCell(data_cols.cibles + ligne_courante).value =
        fiche.cibles?.join(', ');
      worksheet.getCell(data_cols.structures + ligne_courante).value =
        joinNames(fiche.structures);
      worksheet.getCell(data_cols.ressources + ligne_courante).value =
        fiche.ressources;
      worksheet.getCell(data_cols.partenaires + ligne_courante).value =
        joinNames(fiche.partenaires);
      worksheet.getCell(data_cols.services + ligne_courante).value = joinNames(
        fiche.services
      );
      worksheet.getCell(data_cols.pilotes + ligne_courante).value = joinNames(
        fiche.pilotes
      );
      worksheet.getCell(data_cols.referents + ligne_courante).value = joinNames(
        fiche.referents
      );

      // Modalités de mise en oeuvre
      worksheet.getCell(data_cols.financements + ligne_courante).value =
        fiche.financements;
      worksheet.getCell(data_cols.financeur1_nom + ligne_courante).value =
        fiche.financeurs?.[0]?.financeur_tag?.nom;
      setEuroValue(
        worksheet.getCell(data_cols.financeur1_montant + ligne_courante),
        fiche.financeurs?.[0]?.montant_ttc
      );
      worksheet.getCell(data_cols.financeur2_nom + ligne_courante).value =
        fiche.financeurs?.[1]?.financeur_tag?.nom;
      setEuroValue(
        worksheet.getCell(data_cols.financeur2_montant + ligne_courante),
        fiche.financeurs?.[1]?.montant_ttc
      );
      worksheet.getCell(data_cols.financeur3_nom + ligne_courante).value =
        fiche.financeurs?.[2]?.financeur_tag?.nom;
      setEuroValue(
        worksheet.getCell(data_cols.financeur3_montant + ligne_courante),
        fiche.financeurs?.[2]?.montant_ttc
      );
      setEuroValue(
        worksheet.getCell(data_cols.budget_previsionnel + ligne_courante),
        fiche.budget_previsionnel
      );
      worksheet.getCell(data_cols.statut + ligne_courante).value = fiche.statut;
      worksheet.getCell(data_cols.niveau_priorite + ligne_courante).value =
        fiche.niveau_priorite;
      worksheet.getCell(data_cols.date_debut + ligne_courante).value =
        formatDate(fiche.date_debut);
      worksheet.getCell(data_cols.date_fin_provisoire + ligne_courante).value =
        formatDate(fiche.date_fin_provisoire);
      worksheet.getCell(
        data_cols.amelioration_continue + ligne_courante
      ).value = fiche.amelioration_continue ? 'VRAI' : 'FAUX';
      worksheet.getCell(data_cols.calendrier + ligne_courante).value =
        fiche.calendrier;
      worksheet.getCell(data_cols.actions + ligne_courante).value =
        fiche.actions
          ?.map(({ id }) => actionLabels[id])
          .filter((s) => !!s)
          .join(',');
      worksheet.getCell(data_cols.fiches_liees + ligne_courante).value =
        fiche.fiches_liees?.map((f) => f.titre).join('\n');
      worksheet.getCell(
        data_cols.notes_complementaires + ligne_courante
      ).value = fiche.notes_complementaires;

      // libellés (nom du fichier ou titre du lien) des annexes associées à la fiche
      const annexesFiche = getAnnexesLabels(annexes, fiche.id);
      worksheet.getCell(data_cols.annexes + ligne_courante).value =
        annexesFiche?.join('\n');
    }

    // ligne suivante
    ligne_courante += 1;
  });
};

const joinNames = (items: Array<{ nom: string }> | null) =>
  items?.map(({ nom }) => nom).join(', ');

const joinTitres = (items: Array<{ titre: string }> | null) =>
  items?.map(({ titre }) => titre).join(', ');
