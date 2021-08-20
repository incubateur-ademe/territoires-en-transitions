import {
  indicateurPersonnaliseStore,
  indicateurPersonnaliseValueStore,
  indicateurReferentielCommentaireStore,
  indicateurValueStore,
} from '../api/hybridStores';
import {IndicateurPersonnaliseValueStorable} from 'storables/IndicateurPersonnaliseValueStorable';
import {IndicateurValueStorable} from 'storables/IndicateurValueStorable';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';

/**
 * todo remove getters and use hooks instead.
 */

const getIndicateurReferentielValue = (indicateurId: string) =>
  indicateurValueStore.retrieveById(indicateurId);

const storeIndicateurReferentielValue = (storable: IndicateurValueStorable) =>
  indicateurValueStore.store(storable);

const getAllIndicateursPersonnalises = () =>
  indicateurPersonnaliseStore.retrieveAll();

export const getIndicateurPersonnaliseValue = (indicateurId: string) =>
  indicateurPersonnaliseValueStore.retrieveById(indicateurId);
const storeIndicateurPersonnalise = (
  storable: IndicateurPersonnaliseStorable
) => indicateurPersonnaliseStore.store(storable);

const storeIndicateurPersonnaliseValue = (
  storable: IndicateurPersonnaliseValueStorable
) => indicateurPersonnaliseValueStore.store(storable);

const getIndicateurReferentielCommentaire = (id: string) =>
  indicateurReferentielCommentaireStore.retrieveById(id);

const storeIndicateurReferentielCommentaire = (
  storable: IndicateurReferentielCommentaireStorable
) => indicateurReferentielCommentaireStore.store(storable);

export const indicateurs = {
  getIndicateurReferentielValue,
  storeIndicateurReferentielValue,

  getAllIndicateursPersonnalises,
  storeIndicateurPersonnalise,

  getIndicateurPersonnaliseValue,
  storeIndicateurPersonnaliseValue,

  getIndicateurReferentielCommentaire,
  storeIndicateurReferentielCommentaire,
};
