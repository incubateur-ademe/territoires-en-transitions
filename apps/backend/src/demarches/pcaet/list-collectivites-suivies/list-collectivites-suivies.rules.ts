import type {
  CollectiviteCouverteRow,
  DossierInstructionRow,
} from '../list-dossiers-instruction/list-dossiers-instruction.repository';
import type { CollectiviteSuivie } from './list-collectivites-suivies.output';

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/**
 * Les collectivités d'un territoire, une fois chacune, par nom.
 *
 * Une collectivité peut porter plusieurs lignes — un PCAET publié et son
 * renouvellement — : elle n'est suggérée qu'une fois. Un EPCI couvert par un
 * Supra se cherche aussi, et retient son porteur, qu'il ait ou non des lignes à
 * lui (ses dossiers passés) et quel que soit l'ordre où elles arrivent.
 */
export const buildCollectivitesSuivies = (
  rows: readonly DossierInstructionRow[],
  couvertesParDemarche: ReadonlyMap<number, readonly CollectiviteCouverteRow[]>
): CollectiviteSuivie[] => {
  const byId = new Map<number, CollectiviteSuivie>();

  for (const row of rows) {
    const couvertes =
      row.demarcheId === null
        ? []
        : couvertesParDemarche.get(row.demarcheId) ?? [];
    const existing = byId.get(row.collectiviteId);
    byId.set(row.collectiviteId, {
      id: row.collectiviteId,
      nom: row.collectiviteNom,
      departementCode: row.collectiviteDepartementCode,
      departementLibelle: row.collectiviteDepartementLibelle,
      regionCode: row.collectiviteRegionCode,
      regionLibelle: row.collectiviteRegionLibelle,
      porteur: existing?.porteur ?? null,
      isSupra: (existing?.isSupra ?? false) || couvertes.length > 0,
    });

    for (const couverte of couvertes) {
      const existingCouverte = byId.get(couverte.id);
      byId.set(couverte.id, {
        ...(existingCouverte ?? {
          id: couverte.id,
          nom: couverte.nom,
          departementCode: couverte.departementCode,
          departementLibelle: couverte.departementLibelle,
          regionCode: couverte.regionCode,
          regionLibelle: couverte.regionLibelle,
          isSupra: false,
        }),
        porteur: existingCouverte?.porteur ?? {
          id: row.collectiviteId,
          nom: row.collectiviteNom,
        },
      });
    }
  }

  return [...byId.values()].sort((a, b) => collator.compare(a.nom, b.nom));
};
