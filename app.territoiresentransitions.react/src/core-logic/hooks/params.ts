import {
  ActionVueParamOption,
  LabellisationVueParamOption,
  ReferentielVueParamOption,
} from 'app/paths';
import { usePathname } from 'next/navigation';
import { useParams } from 'react-router-dom';

// TODO: Utiliser un react context here basé sur les useParams quand toutes les routes seront sous Next
export const useCollectiviteId = (): number | null => {
  const pathname = usePathname();
  // Match /collectivite/123 or /collectivite/123/
  const match = pathname.match(/^\/collectivite\/(\d+)/);
  const collectiviteId = match ? parseInt(match[1]) : null;

  return collectiviteId;
};

export const useReferentielId = (): string | null => {
  const { referentielId } = useParams<{ referentielId: string | undefined }>();
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
