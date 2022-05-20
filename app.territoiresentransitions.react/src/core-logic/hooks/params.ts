import {useParams} from 'react-router-dom';
import {ReferentielVueParamOption} from 'app/paths';

export const useCollectiviteId = (): number | null => {
  const {collectiviteId} = useParams<{collectiviteId: string | undefined}>();
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
