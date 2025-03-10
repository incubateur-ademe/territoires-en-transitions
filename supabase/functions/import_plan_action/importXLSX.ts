// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.2/package/types/index.d.ts"
import * as xlsx from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs';
import * as cptable from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/cpexcel.full.mjs';
import * as nettoie from './fonctionsDeNettoyage.ts';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { fetchData, TMemoire } from './fetchData.ts';
import { TAxeImport, TFicheActionImport, TFinanceur, TTag } from './types.ts';
import { saveData } from './saveData.ts';

xlsx.set_cptable(cptable);

const nomColonnes: string[] = [
  'Axe (x)',
  'Sous-axe (x.x)',
  'Sous-sous axe (x.x.x)',
  'Titre de la fiche action',
  'Descriptif',
  'Thématique principale',
  'Sous-thématiques',
  'Instances de gouvernance',
  'Objectifs',
  'Indicateurs liés',
  'Résultats attendus',
  'Cibles',
  'Structure pilote',
  'Moyens humains et techniques',
  'Partenaires',
  'Service-département-pôle pilote',
  'Personne pilote',
  'Élu·e référent·e',
  'Participation Citoyenne',
  'Financements',
  'Financeur 1',
  'Montant € TTC',
  'Financeur 2',
  'Montant € TTC',
  'Financeur 3',
  'Montant € TTC',
  'Budget prévisionnel total € TTC',
  'Statut',
  'Niveau de priorité',
  'Date de début',
  'Date de fin',
  'Action en amélioration continue',
  'Calendrier',
  'Actions liées',
  'Fiches des plans liées',
  'Notes de suivi',
  'Etapes de la fiche action',
  'Notes complémentaires',
  'Documents et liens',
];

/**
 * Transforme et sauvegarde le fichier excel en plan d'action
 * @param supabaseClient client supabase
 * @param file fichier excel
 * @param collectivite_id id de la collectivité
 * @param planNom nom du plan à importer
 * @param planType id du type de plan
 * @return ??
 */
export const XLSXToPlan = async (
  supabaseClient: TSupabaseClient,
  file: any,
  collectivite_id: number,
  planNom: string,
  planType: number | null
) => {
  const sheet = file.Sheets[file.SheetNames[0]];
  // Récupère la ligne d'en-tête et la ligne de fin du fichier
  let derniereCellule = 0;
  let entete = 0;
  for (const cellAddress in sheet) {
    if (sheet.hasOwnProperty(cellAddress)) {
      const cell = sheet[cellAddress];
      const cellCoord = xlsx.utils.decode_cell(cellAddress);
      if (cellCoord.r > 0) {
        if (cell.v == 'Axe (x)') {
          entete = cellCoord.r;
        }
        derniereCellule = cellCoord.r;
      }
    }
  }
  // Vérifie les colonnes
  await verifieColonnes(sheet, entete);

  // Récupérer les données utiles au nettoyage du fichier
  const memoire = await fetchData(supabaseClient, collectivite_id);
  // Traiter le fichier
  const fiches: TFicheActionImport[] = [];
  const plan: TAxeImport = {
    nom: planNom ? planNom : 'Nouveau plan importé',
    parent: null,
    type: planType,
  };
  for (let ligne = entete + 1; ligne < derniereCellule + 1; ligne++) {
    fiches.push(await ligneXLSXToFiche(sheet, ligne, plan, memoire));
  }
  // Sauvegarde du fichier
  return await saveData(supabaseClient, memoire, fiches);
};

/**
 * Transforme une ligne du fichier excel en fiche
 * @param sheet page excel
 * @param ligne numéro de la ligne excel à traiter
 * @param plan axe niveau 1
 * @param memoire données utiles au nettoyage du fichier
 * @return la fiche
 */
const ligneXLSXToFiche = async (
  sheet: any,
  ligne: number,
  plan: TAxeImport,
  memoire: TMemoire
): Promise<TFicheActionImport> => {
  // Variables pour les axes
  let axe = null;
  let sousAxe = null;
  let sousSousAxe = null;

  // Variables pour les financeurs
  let f1 = null;
  let m1 = null;
  let f2 = null;
  let m2 = null;
  let f3 = null;
  let m3 = null;

  // Création de la fiche
  const f: TFicheActionImport = {};
  f.collectivite_id = memoire.collectivite_id;
  for (let colonne = 0; colonne < nomColonnes.length; colonne++) {
    const res = await celluleXLSXToElementFiche(
      sheet,
      ligne,
      colonne,
      plan,
      memoire,
      f
    );
    switch (colonne) {
      case 0: // Axe (x) -> A | 1
        axe = res;
        break;
      case 1: // Sous-axe (x.x) -> B | 2
        sousAxe = res;
        break;
      case 2: // Sous-sous-axe (x.x) -> C | 3
        sousSousAxe = res;
        break;
      case 20: // Financeur 1 -> U | 21
        f1 = res;
        break;
      case 21: // Montant € TTC -> V | 22
        m1 = res;
        break;
      case 22: // Financeur 2 -> W | 23
        f2 = res;
        break;
      case 23: // Montant € TTC -> X | 24
        m2 = res;
        break;
      case 24: // Financeur 3 -> Y | 25
        f3 = res;
        break;
      case 25: // Montant € TTC -> Z | 26
        m3 = res;
        break;
    }
  }
  f.axeImport = await getAxe(plan, axe, sousAxe, sousSousAxe);
  f.financeurs = await getFinanceurs(f1, m1, f2, m2, f3, m3);
  return f;
};

/**
 * Transforme une cellule du fichier excel en élément de la fiche
 * @param sheet page excel
 * @param ligne numéro de la ligne excel à traiter
 * @param colonne numéro de la colonne excel à traiter
 * @param plan axe niveau 1
 * @param memoire données utiles au nettoyage du fichier
 * @param f fiche action auquel ajouter l'élément
 * @return la fiche
 */
const celluleXLSXToElementFiche = async (
  sheet: any,
  ligne: number,
  colonne: number,
  plan: TAxeImport,
  memoire: TMemoire,
  f: TFicheActionImport
): Promise<any | null> => {
  const celluleCoordonnes = xlsx.utils.encode_cell({ r: ligne, c: colonne });
  const cellule = !sheet[celluleCoordonnes] ? null : sheet[celluleCoordonnes].v;
  try {
    switch (colonne) {
      case 0: // Axe (x) -> A | 1
      case 1: // Sous-axe (x.x) -> B | 2
      case 2: // Sous-sous-axe (x.x) -> C | 3
        return await nettoie.texte(cellule, true);
      case 3: // Titre de la fiche action -> D | 4
        f.titre = await nettoie.texte(cellule, true);
        break;
      case 4: // Descriptif -> E | 5
        f.description = await nettoie.texte(cellule, true);
        break;
      case 5: // Thématique principale -> F | 6
        f.thematiques = await nettoie.thematique(cellule, memoire);
        break;
      case 6: // Sous-thématiques -> G | 7
        f.sous_thematiques = await nettoie.sousThematique(cellule, memoire);
        break;
      case 7: // Instances de gouvernances -> H | 8
        break;
      case 8: // Objectifs -> I | 9
        f.objectifs = await nettoie.texte(cellule, false);
        break;
      case 9: // Indicateurs liés -> J | 10
        f.indicateurs = await nettoie.indicateurs(cellule, memoire);
        break;
      case 10: // Résultats attendus -> K | 11
        f.resultats_attendus = await nettoie.resultats(cellule, memoire);
        break;
      case 11: // Cibles -> L | 12
        f.cibles = await nettoie.cibles(cellule);
        break;
      case 12: // Structure pilote -> M | 13
        f.structures = await nettoie.tags(cellule, memoire);
        break;
      case 13: // Moyens humains et techniques -> N | 14
        f.ressources = await nettoie.texte(cellule, false);
        break;
      case 14: // Partenaires -> O | 15
        f.partenaires = await nettoie.tags(cellule, memoire);
        break;
      case 15: // Service-département-pôle pilote -> P | 16
        f.services = await nettoie.tags(cellule, memoire);
        break;
      case 16: // Personne pilote -> Q | 17
        f.pilotes = await nettoie.personnes(cellule, memoire);
        break;
      case 17: // Élu·e référent·e -> R | 18
        f.referents = await nettoie.personnes(cellule, memoire);
        break;
      case 18: // Participation Citoyenne -> S | 19
        break;
      case 19: // Financements -> T | 20
        f.financements = await nettoie.texte(cellule, false);
        break;
      case 20: // Financeur 1 -> U | 21
      case 22: // Financeur 2 -> W | 23
      case 24: // Financeur 3 -> Y | 25
        return await nettoie.tags(cellule, memoire);
      case 21: // Montant € TTC -> V | 22
      case 23: // Montant € TTC -> X | 24
      case 25: // Montant € TTC -> Z | 26
        return await nettoie.entier(cellule);
      case 26: // Budget prévisionnel total € TTC -> AA | 27
        f.budget_previsionnel = await nettoie.entier(cellule);
        break;
      case 27: // Statut -> AB | 28
        f.statut = await nettoie.statut(cellule);
        break;
      case 28: // Niveau de priorité -> AC | 29
        f.niveau_priorite = await nettoie.niveauPriorite(cellule);
        break;
      case 29: // Date de début -> AD | 30
        f.date_debut = await nettoie.date(sheet, celluleCoordonnes);
        break;
      case 30: // Date de fin -> AE | 31
        f.date_fin_provisoire = await nettoie.date(sheet, celluleCoordonnes);
        break;
      case 31: // Action en amélioration continue -> AF | 32
        f.amelioration_continue = await nettoie.booleen(cellule);
        break;
      case 32: // Calendrier -> AG | 33
        f.calendrier = await nettoie.texte(cellule, false);
        break;
      case 33: // Actions liées -> AH | 34
        f.actions = await nettoie.actions(cellule, memoire);
        break;
      case 34: // Fiches des plans liées -> AI | 35
        f.fiches_liees = await nettoie.fiches(cellule, memoire);
        break;
      case 35: // Notes de suivi -> AJ | 37
        break;
      case 36: // Etapes de la fiche action -> AK | 38
        break;
      case 37: // Notes complémentaires -> AL | 39
        f.notes_complementaires = await nettoie.texte(cellule, false);
        break;
      case 38: // Documents et liens -> AM | 40
        f.annexesImport = await nettoie.annexes(cellule);
        break;
    }
  } catch (error) {
    throw new Error('Cellule ' + celluleCoordonnes + ' : ' + error.message);
  }
  return null;
};

/**
 * Récupère et créé l'arborescence des axes de la fiche
 * @param plan axe niveau 1
 * @param axe axe niveau 2
 * @param sousAxe axe niveau 3
 * @param sousSousAxe axe niveau 4
 * @return l'axe sous lequel est directement la fiche
 */
const getAxe = async (
  plan: TAxeImport,
  axe: string | null,
  sousAxe: string | null,
  sousSousAxe: string | null
): Promise<TAxeImport> => {
  let a1: TAxeImport | null = null;
  if (axe) {
    a1 = {
      nom: axe,
      parent: plan,
    };
  }
  let a2: TAxeImport | null = null;
  if (sousAxe) {
    a2 = { nom: sousAxe, parent: null };
    if (a1) {
      a2.parent = a1;
    } else {
      a2.parent = plan;
    }
  }
  let a3: TAxeImport | null = null;
  if (sousSousAxe) {
    a3 = { nom: sousSousAxe, parent: null };
    if (a2) {
      a3.parent = a2;
    } else if (a1) {
      a3.parent = a1;
    } else {
      a3.parent = plan;
    }
  }
  return !a3 ? (!a2 ? (!a1 ? plan : a1) : a2) : a3;
};

/**
 * Créer les couples financeur - montant
 * @param f1 financeur 1
 * @param m1 montant 1
 * @param f2 financeur 2
 * @param m2 montant 2
 * @param f3 financeur 3
 * @param m3 montant 3
 * @return les couples financeur - montant
 */
const getFinanceurs = async (
  f1: TTag[] | null,
  m1: number | null,
  f2: TTag[] | null,
  m2: number | null,
  f3: TTag[] | null,
  m3: number | null
): Promise<TFinanceur[]> => {
  const financeurs: TFinanceur[] = [];
  const fm1 = await getFinanceur(f1, m1);
  if (fm1) {
    financeurs.push(fm1);
  }
  const fm2 = await getFinanceur(f2, m2);
  if (fm2) {
    financeurs.push(fm2);
  }
  const fm3 = await getFinanceur(f3, m3);
  if (fm3) {
    financeurs.push(fm3);
  }
  return financeurs;
};

/**
 * Créer un couple financeur - montant
 * @param f financeur
 * @param m montant
 * @return le couple financeur - montant
 */
const getFinanceur = async (
  f: TTag[] | null,
  m: number | null
): Promise<TFinanceur | null> => {
  if (!f || f.length == 0) {
    return null;
  } else {
    return {
      financeur_tag: f[0],
      montant_ttc: m,
    };
  }
};

/**
 * Vérifie les colonnes
 * @param sheet page excel
 * @param ligne numéro de la ligne excel d'entête
 */
const verifieColonnes = async (sheet: any, ligne: number) => {
  for (let colonne = 0; colonne < nomColonnes.length; colonne++) {
    const celluleCoordonnes = xlsx.utils.encode_cell({ r: ligne, c: colonne });
    const cellule = !sheet[celluleCoordonnes]
      ? null
      : sheet[celluleCoordonnes].v;
    const nom = await nettoie.texte(cellule, true);
    if (nom != nomColonnes[colonne]) {
      if (nomColonnes.includes(nom)) {
        throw Error('La colonne ' + nom + " n'est pas au bon endroit.");
      } else {
        throw Error('La colonne ' + nom + " n'est pas reconnue.");
      }
    }
  }
  return null;
};
