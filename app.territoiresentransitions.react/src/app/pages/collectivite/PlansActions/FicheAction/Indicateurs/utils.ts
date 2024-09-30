import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';
import {TFicheActionIndicateurInsert} from 'types/alias';

// TEMPORAIRE : À supprimer après la refonte de l'objet FicheAction
// et de sa fonction d'update depuis une vue SupaBase
// - fetchFicheAction
// - upsertFicheAction

export const factoryIndicateurInsertToIndicateurListItem = (
  indicateur: TFicheActionIndicateurInsert
): TIndicateurListItem => ({
  id: indicateur.id!,
  identifiant: indicateur.identifiant_referentiel ?? null,
  estPerso: !!indicateur.collectivite_id,
  titre: indicateur.titre,
  hasOpenData: false, // Indisponnible depuis TFicheActionIndicateurInsert mais obligatoire
});

export const factoryIndicateurListItemToIndicateurInsert = (
  indicateur: TIndicateurListItem
): TFicheActionIndicateurInsert => ({
  id: indicateur.id,
  identifiant_referentiel: indicateur.identifiant,
  titre: indicateur.titre,
  unite: '', // Indisponnible depuis TIndicateurListItem mais obligatoire
});
