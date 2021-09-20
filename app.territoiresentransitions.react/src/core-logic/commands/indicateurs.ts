import {
  indicateurPersonnaliseStore,
  indicateurPersonnaliseResultatStore,
  indicateurReferentielCommentaireStore,
  indicateurResultatStore,
} from 'core-logic/api/hybridStores';
import {AnyIndicateurValueStorable} from 'storables';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';

/**
 * todo remove getters and use hooks instead.
 */

const getIndicateurReferentielResultat = (indicateurId: string) =>
  indicateurResultatStore.retrieveById(indicateurId);

const storeIndicateurReferentielResultat = (
  storable: AnyIndicateurValueStorable
) => indicateurResultatStore.store(storable);

const getAllIndicateursPersonnalises = () =>
  indicateurPersonnaliseStore.retrieveAll();

export const getIndicateurPersonnaliseResultat = (indicateurId: string) =>
  indicateurPersonnaliseResultatStore.retrieveById(indicateurId);
const storeIndicateurPersonnalise = (
  storable: IndicateurPersonnaliseStorable
) => indicateurPersonnaliseStore.store(storable);

const storeIndicateurPersonnaliseResultat = (
  storable: AnyIndicateurValueStorable
) => indicateurPersonnaliseResultatStore.store(storable);

const getIndicateurReferentielCommentaire = (id: string) =>
  indicateurReferentielCommentaireStore.retrieveById(id);

const storeIndicateurReferentielCommentaire = (
  storable: IndicateurReferentielCommentaireStorable
) => indicateurReferentielCommentaireStore.store(storable);

export const indicateurs = {
  getIndicateurReferentielResultat,
  storeIndicateurReferentielResultat,

  getAllIndicateursPersonnalises,
  storeIndicateurPersonnalise,

  getIndicateurPersonnaliseResultat,
  storeIndicateurPersonnaliseResultat,

  getIndicateurReferentielCommentaire,
  storeIndicateurReferentielCommentaire,
};
