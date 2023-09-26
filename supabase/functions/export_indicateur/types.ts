import { Enums, Tables } from '../_shared/typeUtils.ts';

export type TIndicateurId = string | number;
export type TIndicateurValeur = {
  id: TIndicateurId;
  type: Enums<'indicateur_valeur_type'>;
  annee: number;
  valeur: number;
};

export type TExportArgs = {
  collectivite_id: number;
  indicateur_ids: TIndicateurId[];
};

export type TIndicateurDefinition = Tables<'indicateur_definition'> & {
  enfants?: TIndicateurDefinition[];
  thematiqueNoms?: string[];
};
