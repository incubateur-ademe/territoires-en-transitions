import {ValuesToUnion, Tables} from '@tet/api';

type Rempli = boolean | null;

type Thematique = {
  id: number;
  nom: string;
};

/** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
export type TIndicateurListItem = {
  id: string | number;
  nom: string;
};

/** Item détaillé pour la vignette graphique dans une liste d'indicateurs */
export type TIndicateurChartInfo = {
  nom: string;
  unite: string;
  rempli: Rempli;
  confidentiel: boolean;
  participation_score: boolean;
  titre_long?: string;
  sans_valeur?: boolean | null;
  enfants?: {id: string; rempli: Rempli}[] | null;
  count?: number;
  total?: number;
};

/**
 * Item complet pour l'affichage du détail d'un indicateur prédéfini
 * (et ses éventuels enfants)
 */
// liste explicitement les colonnes sélectionnées car on ne veut pas utiliser
// '*' lors du select afin d'exclure certaines colonnes (collectivite_id, fts)
export const INDICATEUR_PREDEFINI_COLS = [
  'id',
  'identifiant',
  'nom',
  'description',
  'unite',
  'titre_long',
  'programmes',
  'sans_valeur',
  'valeur_indicateur',
  'participation_score',
  'type',
] as const;

export type TIndicateurPredefiniEnfant = TIndicateurPredefini & {
  parent: string;
};

export type TIndicateurPredefini = Pick<
  Tables<'indicateur_definition'>,
  ValuesToUnion<typeof INDICATEUR_PREDEFINI_COLS>
> & {
  action_ids: string[];
  enfants: TIndicateurPredefiniEnfant[] | undefined;
  thematiques: Thematique[];
  rempli: Rempli;
  isPerso: undefined;
  parent: string | null | undefined;
};

/**
 * Item complet pour l'affichage du détail d'un indicateur personnalisé
 */
export const INDICATEUR_PERSO_COLS = [
  'id',
  'titre',
  'description',
  'unite',
  'commentaire',
] as const;

export type TIndicateurPersonnalise = Pick<
  Tables<'indicateur_personnalise_definition'>,
  ValuesToUnion<typeof INDICATEUR_PERSO_COLS>
> & {
  nom: string; // contient la valeur de `titre`
  thematiques: Thematique[];
  rempli: Rempli;
  isPerso: boolean;
};

export type TIndicateurDefinition =
  | TIndicateurPredefini
  | TIndicateurPersonnalise;
