import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseStorable} from 'storables';

/**
 * todo remove getters and use hooks instead.
 */

const storeIndicateurPersonnalise = (
  storable: IndicateurPersonnaliseStorable
) => indicateurPersonnaliseStore.store(storable);

export const indicateurs = {
  storeIndicateurPersonnalise,
};
