import {
  DemarchePcaetVulnerabiliteNiveauEnum,
  type DemarchePcaetVulnerabiliteNiveau,
} from './demarche-pcaet-vulnerabilite-niveau.enum.schema';
import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteLigne,
} from './demarche-pcaet-vulnerabilite.schema';

/**
 * Un objectif d'adaptation n'a de sens que si le territoire est concerné à cet
 * horizon : demander une phrase pour chaque thématique « non concerné » ne
 * produirait que des « RAS ».
 */
export const isVulnerabiliteObjectifRequis = (
  niveau: DemarchePcaetVulnerabiliteNiveau | null
): boolean =>
  niveau !== null &&
  niveau !== DemarchePcaetVulnerabiliteNiveauEnum.NON_CONCERNE;

const isRenseigne = (texte: string | null): boolean =>
  texte !== null && texte.trim().length > 0;

/** Une ligne est complète quand ses trois horizons sont tranchés et motivés. */
export const isVulnerabiliteLigneComplete = (
  ligne: DemarchePcaetVulnerabiliteLigne
): boolean =>
  ligne.niveauMaintenant !== null &&
  ligne.niveau2050 !== null &&
  ligne.niveau2100 !== null &&
  (!isVulnerabiliteObjectifRequis(ligne.niveau2050) ||
    isRenseigne(ligne.objectifs2050)) &&
  (!isVulnerabiliteObjectifRequis(ligne.niveau2100) ||
    isRenseigne(ligne.objectifs2100));

/**
 * Complétude du volet vulnérabilité : chaque thématique requise (le socle) porte
 * une ligne complète. Les thématiques ajoutées par la collectivité ne sont pas
 * requises : elles ne retiennent jamais le dossier.
 */
export const isPcaetDiagnosticVulnerabiliteComplete = (
  vulnerabilite: Pick<DemarchePcaetVulnerabilite, 'thematiques' | 'lignes'>
): boolean => {
  const lignesParThematique = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.thematiqueId, ligne])
  );
  return vulnerabilite.thematiques
    .filter((thematique) => thematique.requis)
    .every((thematique) => {
      const ligne = lignesParThematique.get(thematique.id);
      return ligne !== undefined && isVulnerabiliteLigneComplete(ligne);
    });
};
