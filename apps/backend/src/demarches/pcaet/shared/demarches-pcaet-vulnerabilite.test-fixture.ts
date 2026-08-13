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

/** Identifiant d'un domaine du socle, par son code métier. */
export const domaineIdOf = (
  diagnostic: DemarchePcaetDiagnostic,
  code: string
): number => {
  const domaine = vulnerabiliteOf(diagnostic).domaines.find(
    (d) => d.code === code
  );
  if (!domaine) {
    throw new Error(`Le domaine ${code} est absent du socle`);
  }
  return domaine.id;
};

/** Ligne de saisie d'un domaine, ou une erreur explicite. */
export const ligneOf = (
  diagnostic: DemarchePcaetDiagnostic,
  domaineId: number
) => {
  const ligne = vulnerabiliteOf(diagnostic).lignes.find(
    (l) => l.domaineId === domaineId
  );
  if (!ligne) {
    throw new Error(`Le domaine ${domaineId} n'a pas de ligne`);
  }
  return ligne;
};
