// Lignes ps brutes → services triés pour l'affichage. Seul point du domaine
// qui connaît à la fois StackService (modèle) et UrlResolver (résolution
// d'URL) — les deux s'ignorent l'un l'autre.
import { APPS } from '../../dev-apps.mts';
import type { PsRow } from '../docker-stack.mts';
import { StackService } from './service.mts';
import { ABSENT_STATE } from './status.mts';
import type { UrlResolver } from './url-resolver.mts';

// Les apps du registre jamais lancées (tools, exclue par défaut) n'ont pas de
// conteneur : on les rajoute pour pouvoir les créer depuis la liste. Pas sur
// une stack vide, qui doit continuer d'afficher « lancez make up ».
const absentAppRows = (rows: PsRow[]): PsRow[] => {
  if (!rows.length) return [];
  const present = new Set(rows.map((row) => row.Service));
  return Object.keys(APPS)
    .filter((app) => !present.has(app))
    .map((app) => ({ Service: app, State: ABSENT_STATE }));
};

export const buildServices = (
  rows: PsRow[],
  resolver: UrlResolver
): StackService[] =>
  rows
    .map((row) => new StackService(row, resolver.urlFor(row.Service)))
    .concat(absentAppRows(rows).map((row) => new StackService(row, null)))
    .sort(StackService.compare);
