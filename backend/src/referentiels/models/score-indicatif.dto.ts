import { SourceMetadonnee } from '@/backend/indicateurs/index-domain';
import { TypeScoreIndicatif } from '@/backend/referentiels/index-domain';

// score indicatif d'une action
export type ScoreIndicatifAction = {
  actionId: string;
  indicateurs: IndicateurAssocie[];
  fait: ScoreIndicatif | null;
  programme: ScoreIndicatif | null;
};

// indicateur associé à une action/formule de calcul
export type IndicateurAssocie = {
  actionId: string;
  indicateurId: number;
  identifiantReferentiel: string;
  titre: string;
  unite: string;
  optional?: boolean;
};

// score indicatif programmé ou fait
type ScoreIndicatif = {
  score: number;
  valeursUtilisees: Pick<
    ValeurUtilisee,
    | 'indicateurId'
    | 'dateValeur'
    | 'sourceLibelle'
    | 'sourceMetadonnee'
    | 'valeur'
  >[];
};

// valeur utilisée par le calcul
export type ValeurUtilisee = {
  actionId: string;
  indicateurId: number;
  indicateurValeurId: number;
  valeur: number;
  dateValeur: string;
  typeScore: TypeScoreIndicatif;
  sourceLibelle: string | null;
  sourceMetadonnee: SourceMetadonnee | null;
};

// valeurs pouvant être utilisées pour le calcul
export type ScoreIndicatifActionValeurUtilisable = {
  actionId: string;
  indicateurs: {
    indicateurId: number;
    identifiantReferentiel: string;
    unite: string;
    titre: string;
    // sélection actuelle
    selection: Record<
      TypeScoreIndicatif,
      {
        id: number;
        annee: number;
        source: string;
        valeur: number;
      } | null
    >;
    sources: {
      source: string;
      libelle: string | null;
      ordreAffichage: number;
      fait: ValeurUtilisable[];
      programme: ValeurUtilisable[];
    }[];
  }[];
};

// une valeur pouvant être utilisée pour le calcul
type ValeurUtilisable = {
  id: number;
  valeur: number;
  dateValeur: string;
  annee: number;
  utilisee: boolean;
};
