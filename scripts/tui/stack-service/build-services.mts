// Lignes ps brutes → services triés pour l'affichage. Seul point du domaine
// qui connaît à la fois StackService (modèle) et UrlResolver (résolution
// d'URL) — les deux s'ignorent l'un l'autre.
import type { PsRow } from '../docker-stack.mts';
import { StackService } from './service.mts';
import type { UrlResolver } from './url-resolver.mts';

export const buildServices = (
  rows: PsRow[],
  resolver: UrlResolver
): StackService[] =>
  rows
    .map((row) => new StackService(row, resolver.urlFor(row.Service)))
    .sort(StackService.compare);
