import {Database} from 'types/database.types';

export type TIndicateurReferentielDefinition =
  Database['public']['Tables']['indicateur_definition']['Row'] & {
    isPerso?: undefined;
    titre?: undefined;
    actions: string[];
  };

// TODO: corriger le typage côté back ?
// collectivite_id: number | null => ne devrait pas pouvoir être `null` ?
export type TIndicateurPersoDefinition =
  Database['public']['Tables']['indicateur_personnalise_definition']['Row'] & {
    id: number;
    collectivite_id: number;
    isPerso: true;
    nom: undefined;
  };

export type TIndicateurDefinition =
  | TIndicateurReferentielDefinition
  | TIndicateurPersoDefinition;

export type TIndicateurThematiqueId =
  Database['public']['Enums']['indicateur_thematique'];
