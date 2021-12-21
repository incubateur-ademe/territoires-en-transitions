import {
  indicateurPersonnaliseStore,
  indicateurReferentielCommentaireStore,
} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseStorable} from 'storables';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';

/**
 * todo remove getters and use hooks instead.
 */

const storeIndicateurPersonnalise = (
  storable: IndicateurPersonnaliseStorable
) => indicateurPersonnaliseStore.store(storable);
const getIndicateurReferentielCommentaire = (id: string) =>
  indicateurReferentielCommentaireStore.retrieveById(id);

const storeIndicateurReferentielCommentaire = (
  storable: IndicateurReferentielCommentaireStorable
) => indicateurReferentielCommentaireStore.store(storable);

export const indicateurs = {
  getIndicateurReferentielCommentaire, // TODO: This should be a hook.
  storeIndicateurPersonnalise,
  storeIndicateurReferentielCommentaire,
};
