import {HybridStore} from 'core-logic/api/hybridStore';
import {
  indicateurPersonnaliseStore,
  indicateurReferentielCommentaireStore,
} from 'core-logic/api/hybridStores';
import {AnyIndicateurValueInterface} from 'generated/models';
import {
  AnyIndicateurValueStorable,
  IndicateurPersonnaliseStorable,
} from 'storables';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {inferValueIndicateurUid} from 'utils/referentiels';

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

const storeAnyIndicateurValue = (props: {
  store: HybridStore<AnyIndicateurValueStorable>;
  interface: AnyIndicateurValueInterface;
}) => {
  props.store.store(
    new AnyIndicateurValueStorable({
      ...props.interface,
      indicateur_id: inferValueIndicateurUid(props.interface.indicateur_id),
    })
  );
};
export const indicateurs = {
  getIndicateurReferentielCommentaire, // TODO: This should be a hook.
  storeIndicateurPersonnalise,
  storeIndicateurReferentielCommentaire,
  storeAnyIndicateurValue,
};
