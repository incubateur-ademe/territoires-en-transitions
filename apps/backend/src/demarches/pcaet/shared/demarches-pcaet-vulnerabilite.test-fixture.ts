import type {
  DemarchePcaetVulnerabilite,
  PcaetDiagnostic,
} from '@tet/domain/demarches';

/** Le volet vulnérabilité d'un diagnostic servi, ou une erreur explicite. */
export const vulnerabiliteOf = (
  diagnostic: PcaetDiagnostic
): DemarchePcaetVulnerabilite => ({
  thematiques: diagnostic.vulnerabilite.thematiques,
  lignes: diagnostic.vulnerabilite.lignes,
});

/** Identifiant d'une thématique du socle, par son code métier. */
export const thematiqueIdOf = (
  diagnostic: PcaetDiagnostic,
  code: string
): number => {
  const thematique = diagnostic.vulnerabilite.thematiques.find(
    (d) => d.code === code
  );
  if (!thematique) {
    throw new Error(`La thématique ${code} est absente du socle`);
  }
  return thematique.id;
};

/** Ligne de saisie d'une thématique, ou une erreur explicite. */
export const ligneOf = (diagnostic: PcaetDiagnostic, thematiqueId: number) => {
  const ligne = diagnostic.vulnerabilite.lignes.find(
    (l) => l.thematiqueId === thematiqueId
  );
  if (!ligne) {
    throw new Error(`La thématique ${thematiqueId} n'a pas de ligne`);
  }
  return ligne;
};
