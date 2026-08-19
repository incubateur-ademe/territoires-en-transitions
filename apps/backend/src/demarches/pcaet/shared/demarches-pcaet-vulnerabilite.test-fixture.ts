import type {
  DemarchePcaetDiagnostic,
  DemarchePcaetVulnerabilite,
} from '@tet/domain/demarches';

/** Le volet vulnérabilité d'un diagnostic servi, ou une erreur explicite. */
export const vulnerabiliteOf = (
  diagnostic: DemarchePcaetDiagnostic
): DemarchePcaetVulnerabilite => {
  const topic = diagnostic.topics.find(
    (t) => t.code === 'vulnerabilite_territoire'
  );
  if (!topic?.vulnerabilite) {
    throw new Error('Le topic vulnerabilite_territoire est absent');
  }
  return topic.vulnerabilite;
};

/** Identifiant d'une thématique du socle, par son code métier. */
export const thematiqueIdOf = (
  diagnostic: DemarchePcaetDiagnostic,
  code: string
): number => {
  const thematique = vulnerabiliteOf(diagnostic).thematiques.find(
    (d) => d.code === code
  );
  if (!thematique) {
    throw new Error(`La thématique ${code} est absente du socle`);
  }
  return thematique.id;
};

/** Ligne de saisie d'une thématique, ou une erreur explicite. */
export const ligneOf = (
  diagnostic: DemarchePcaetDiagnostic,
  thematiqueId: number
) => {
  const ligne = vulnerabiliteOf(diagnostic).lignes.find(
    (l) => l.thematiqueId === thematiqueId
  );
  if (!ligne) {
    throw new Error(`La thématique ${thematiqueId} n'a pas de ligne`);
  }
  return ligne;
};
