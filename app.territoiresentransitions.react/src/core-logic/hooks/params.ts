import {
  ActionVueParamOption,
  collectivitePath,
  LabellisationVueParamOption,
  ReferentielVueParamOption,
} from 'app/paths';
import { useParams } from 'react-router-dom';

export const useCollectiviteId = (): number | null => {
  // on utilise ici useRouteMatch au lieu de useParams car le header
  // n'est plus encapsulé dans la <Route> "/:collectiviteId/*"
  // ce qui fait que le paramètre est toujours vide avec useParams
  // const match = useRouteMatch<{collectiviteId: string}>(collectivitePath);
  // const collectiviteId = match?.params?.collectiviteId;
  // return collectiviteId ? parseInt(collectiviteId) : null;

  // TODO: maybe use a react context here
  return 1;
};

export const useReferentielId = (): string | null => {
  const { referentielId } = useParams<{ referentielId?: string }>();
  return referentielId || null;
};

export const useReferentielVue = (): ReferentielVueParamOption | null => {
  const { referentielVue } = useParams<{
    referentielVue?: ReferentielVueParamOption;
  }>();
  return referentielVue || null;
};

export const useActionVue = (): ActionVueParamOption | null => {
  const { actionVue } = useParams<{
    actionVue?: ActionVueParamOption;
  }>();
  return actionVue || null;
};

export const useLabellisationVue = (): LabellisationVueParamOption | null => {
  const { labellisationVue } = useParams<{
    labellisationVue?: LabellisationVueParamOption;
  }>();
  return labellisationVue || null;
};
