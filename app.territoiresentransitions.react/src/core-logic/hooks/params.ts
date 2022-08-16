import {useParams, useRouteMatch} from 'react-router-dom';
import {
  ActionVueParamOption,
  collectivitePath,
  ReferentielVueParamOption,
} from 'app/paths';

export const useCollectiviteId = (): number | null => {
  // on utilise ici useRouteMatch au lieu de useParams car le header
  // n'est plus encapsulé dans la <Route> "/:collectiviteId/*"
  // ce qui fait que le paramètre est toujours vide avec useParams
  const match = useRouteMatch<{collectiviteId: string}>(collectivitePath);
  const collectiviteId = match?.params?.collectiviteId;
  return collectiviteId ? parseInt(collectiviteId) : null;
};

export const useReferentielId = (): string | null => {
  const {referentielId} = useParams<{referentielId: string | undefined}>();
  return referentielId || null;
};

export const useReferentielVue = (): ReferentielVueParamOption | null => {
  const {referentielVue} =
    useParams<{referentielVue: ReferentielVueParamOption | undefined}>();
  return referentielVue || null;
};

export const useActionVue = (): ActionVueParamOption | null => {
  const {actionVue} =
    useParams<{actionVue: ActionVueParamOption | undefined}>();
  return actionVue || null;
};
