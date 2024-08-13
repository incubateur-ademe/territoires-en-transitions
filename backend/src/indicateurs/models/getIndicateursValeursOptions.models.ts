/**
 * - <b>collectiviteId</b> : identifiant de la collectivité
 * - <b>identifiantReferentiel</b> : liste des identifiants référentiels des indicateurs <i>(ex : cae_1.a)</i>
 * - <b>indicateurId</b> : identifiant d'un indicateur
 * - <b>dateDebut</b> : date minimum
 * - <b>dateFin</b> : date maximum
 * - <b>sourceId</b> : identifiant de la source, null pour les valeurs utilisateurs, unknown pour tous
 * - <b>cleanDoublon</b> : vrai pour enlever les doublons du trio indicateur, collectivite, année <i>(faux par défaut)</i>
 */
export type GetIndicateursValeursOptions = {
  collectiviteId: number;
  identifiantsReferentiel?: string[];
  indicateurId?: number;
  dateDebut?: string;
  dateFin?: string;
  sourceId?: string | null;
  cleanDoublon?: boolean;
};
