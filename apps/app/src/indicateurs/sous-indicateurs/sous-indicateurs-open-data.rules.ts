import type { SousIndicateurDatedValeur } from './sous-indicateurs-table.rules';

export type SousIndicateurOpenDataSource = Readonly<{
  id: string;
  label: string;
  valeurs: readonly SousIndicateurDatedValeur[];
}>;

export type SousIndicateurMoyenneValeur = Readonly<{
  dateValeur: string;
  valeur: number;
}>;

export type SousIndicateurMoyenne = Readonly<{
  indicateurId: number;
  valeurs: readonly SousIndicateurMoyenneValeur[];
}>;

export type SousIndicateurOpenData = Readonly<{
  sources: readonly SousIndicateurOpenDataSource[];
  moyenne: Pick<SousIndicateurMoyenne, 'valeurs'> | null;
}>;

export type SousIndicateurValeursBySource = Readonly<{
  definition: Readonly<{ id: number }>;
  sources: Readonly<
    Record<
      string,
      Readonly<{
        libelle: string;
        valeurs: readonly Readonly<{
          dateValeur: string;
          resultat?: number | null;
          objectif?: number | null;
        }>[];
      }>
    >
  >;
}>;

const hasValeur = ({
  resultat,
  objectif,
}: Readonly<{ resultat?: number | null; objectif?: number | null }>): boolean =>
  resultat != null || objectif != null;

const toOpenDataSources = ({
  indicateur,
  excludedSourceIds,
}: {
  indicateur: SousIndicateurValeursBySource | undefined;
  excludedSourceIds: readonly string[];
}): SousIndicateurOpenDataSource[] =>
  Object.entries(indicateur?.sources ?? {})
    .filter(([id]) => !excludedSourceIds.includes(id))
    .map(([id, { libelle, valeurs }]) => ({
      id,
      label: libelle,
      valeurs: valeurs.filter(hasValeur).map((valeur) => ({
        dateValeur: valeur.dateValeur,
        resultat: valeur.resultat ?? null,
        objectif: valeur.objectif ?? null,
      })),
    }))
    .filter(({ valeurs }) => valeurs.length > 0);

export const toOpenDataByIndicateurId = ({
  indicateurs,
  moyennes,
  excludedSourceIds,
}: {
  indicateurs: readonly SousIndicateurValeursBySource[];
  moyennes: readonly SousIndicateurMoyenne[];
  excludedSourceIds: readonly string[];
}): ReadonlyMap<number, SousIndicateurOpenData> => {
  const indicateurById = new Map(
    indicateurs.map((indicateur) => [indicateur.definition.id, indicateur])
  );
  const moyenneById = new Map(
    moyennes.map((moyenne) => [moyenne.indicateurId, moyenne])
  );
  const indicateurIds = [
    ...new Set([...indicateurById.keys(), ...moyenneById.keys()]),
  ];

  return new Map(
    indicateurIds.flatMap((indicateurId) => {
      const sources = toOpenDataSources({
        indicateur: indicateurById.get(indicateurId),
        excludedSourceIds,
      });
      const moyenne = moyenneById.get(indicateurId);
      const openData: SousIndicateurOpenData = {
        sources,
        moyenne:
          moyenne && moyenne.valeurs.length > 0
            ? { valeurs: moyenne.valeurs }
            : null,
      };
      return sources.length === 0 && openData.moyenne === null
        ? []
        : [[indicateurId, openData] as const];
    })
  );
};
