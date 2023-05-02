import {Workbook, Worksheet} from 'exceljs';
import {format, isValid} from 'date-fns';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {MIME_XLSX, setEuroValue} from 'utils/exportXLSX';
import {TExportData, useExportData} from './useExportData';
import {PlanAction} from '../data/types';

export const useExportPlanAction = (planId: number) => {
  const data = useExportData(planId);
  const {loadTemplate, isLoading, loadPlanAction} = data;

  const exportPlanAction = () => {
    Promise.all([loadTemplate(), loadPlanAction()]).then(
      ([{data: template}, {data: planAction}]) =>
        updateAndSaveXLS({...data, template, planAction})
    );
  };
  return {exportPlanAction, isLoading};
};

// insère les données dans le modèle et sauvegarde le fichier xls résultant
const updateAndSaveXLS = async (data: TExportData) => {
  const {config, planAction, template} = data;
  if (!planAction || !template) {
    return;
  }
  const {plan} = planAction;

  const {first_data_row} = config;

  // ouvre le classeur et sélectionne la première feuille de calcul
  const workbook = new Workbook();
  await workbook.xlsx.load(template);
  const worksheet = workbook.worksheets[0];

  // date d'export
  const exportedAt = new Date();

  // le nom du fichier cible
  const filename = `Export_${plan.axe.nom}_${format(
    exportedAt,
    'yyyy-MM-dd'
  )}.xlsx`;

  // écrit le plan dans la feuille
  ecritPlan(plan, null, first_data_row, worksheet, data);

  // sauvegarde le fichier modifié
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {type: MIME_XLSX});
  saveBlob(blob, filename);
};

const ecritPlan = (
  // portion de plan à écrire
  plan: PlanAction,
  // parents de la portion de plan
  ascendants: PlanAction['axe'][] | null,
  // numéro de la ligne à partir de laquelle écrire
  ligne: number,
  // feuille de calcul dans laquelle écrire
  worksheet: Worksheet,
  // données de l'export
  data: TExportData
) => {
  const {enfants, fiches} = plan;
  const {config, getActionLabel, planAction} = data;
  const {annexes} = planAction || {};
  const {data_cols} = config;
  let ligne_courante = ligne;

  // récupère les noms des ascendants (axe et sous-axes)
  const nom_axe = ascendants?.[0]?.nom || '';
  const sous_axe1 = ascendants?.[1]?.nom || '';
  const sous_axe2 = ascendants?.[2]?.nom || '';

  // écrit les fiches à ce niveau
  fiches?.forEach(fiche => {
    // pour que la hauteur de chaque ligne soit ajustée à son contenu
    worksheet.getRow(ligne_courante).height = undefined!;

    // Présentation de l’action
    worksheet.getCell(data_cols.nom_axe + ligne_courante).value = nom_axe;
    worksheet.getCell(data_cols.sous_axe1 + ligne_courante).value = sous_axe1;
    worksheet.getCell(data_cols.sous_axe2 + ligne_courante).value = sous_axe2;
    worksheet.getCell(data_cols.titre + ligne_courante).value = fiche.titre;
    worksheet.getCell(data_cols.description + ligne_courante).value =
      fiche.description;
    worksheet.getCell(data_cols.thematiques + ligne_courante).value =
      fiche.thematiques?.map(({thematique}) => thematique).join(',');
    worksheet.getCell(data_cols.sous_thematiques + ligne_courante).value =
      fiche.sous_thematiques
        ?.map(({sous_thematique}) => sous_thematique)
        .join(',');

    // Objectifs et indicateurs
    worksheet.getCell(data_cols.objectifs + ligne_courante).value =
      fiche.objectifs;
    worksheet.getCell(data_cols.indicateurs + ligne_courante).value = joinNames(
      fiche.indicateurs
    );
    worksheet.getCell(data_cols.resultats_attendus + ligne_courante).value =
      fiche.resultats_attendus?.join(', ');

    // Acteurs
    worksheet.getCell(data_cols.cibles + ligne_courante).value =
      fiche.cibles?.join(', ');
    worksheet.getCell(data_cols.structures + ligne_courante).value = joinNames(
      fiche.structures
    );
    worksheet.getCell(data_cols.ressources + ligne_courante).value =
      fiche.ressources;
    worksheet.getCell(data_cols.partenaires + ligne_courante).value = joinNames(
      fiche.partenaires
    );
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
    worksheet.getCell(data_cols.date_debut + ligne_courante).value = formatDate(
      fiche.date_debut
    );
    worksheet.getCell(data_cols.date_fin_provisoire + ligne_courante).value =
      formatDate(fiche.date_fin_provisoire);
    worksheet.getCell(data_cols.amelioration_continue + ligne_courante).value =
      fiche.amelioration_continue ? 'VRAI' : 'FAUX';
    worksheet.getCell(data_cols.calendrier + ligne_courante).value =
      fiche.calendrier;
    worksheet.getCell(data_cols.actions + ligne_courante).value = fiche.actions
      ?.map(({id}) => getActionLabel(id))
      .filter(s => !!s)
      .join(',');
    worksheet.getCell(data_cols.fiches_liees + ligne_courante).value =
      fiche.fiches_liees?.map(f => f.titre).join('\n');
    worksheet.getCell(data_cols.notes_complementaires + ligne_courante).value =
      fiche.notes_complementaires;

    // libellés (nom du fichier ou titre du lien) des annexes associées à la fiche
    const annexesFiche = fiche?.id
      ? annexes
          ?.filter(f => f.fiche_id === fiche.id)
          .map(annexe => annexe?.lien?.url || annexe?.fichier?.filename || null)
          .filter(s => !!s)
      : null;
    worksheet.getCell(data_cols.annexes + ligne_courante).value =
      annexesFiche?.join('\n');

    // ligne suivante
    ligne_courante += 1;
  });

  // écrit les sous-niveaux
  enfants?.forEach(enfant => {
    ligne_courante = ecritPlan(
      enfant,
      [...(ascendants || []), enfant.axe],
      ligne_courante,
      worksheet,
      data
    );
  });

  // mais si il n'y a ni fiches ni sous-niveaux, on ajoute une ligne avec le
  // chemin dans l'arbo.
  if (!fiches?.length && !enfants?.length) {
    worksheet.getCell(data_cols.nom_axe + ligne_courante).value = nom_axe;
    worksheet.getCell(data_cols.sous_axe1 + ligne_courante).value = sous_axe1;
    worksheet.getCell(data_cols.sous_axe2 + ligne_courante).value = sous_axe2;
    ligne_courante += 1;
  }

  return ligne_courante;
};

const joinNames = (items: Array<{nom: string}> | null) =>
  items?.map(({nom}) => nom).join(', ');

const formatDate = (strDate: string | null) => {
  if (!strDate) {
    return null;
  }
  const d = new Date(strDate);
  return isValid(d) ? format(d, 'dd/MM/yyyy') : null;
};
