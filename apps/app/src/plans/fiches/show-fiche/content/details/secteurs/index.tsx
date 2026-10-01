import { appLabels } from '@/app/labels/catalog';
import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useFicheContext } from '../../../context/fiche-context';
import { useGetFicheSecteurs } from '../../../data/use-get-fiche-secteurs';
import { InlineEditableItem } from '../editable-item';
import { FicheSecteursList } from './fiche-secteurs.list';

export const Secteurs = () => {
  const isEnabled = useIsFeatureFlagEnabled('is-fiche-secteurs-enabled');
  if (!isEnabled) {
    return null;
  }
  return <SecteursItem />;
};

const SecteursItem = () => {
  const { fiche } = useFicheContext();
  const { data, isLoading, isError } = useGetFicheSecteurs(fiche.id);

  return (
    <InlineEditableItem
      small
      icon="stack-line"
      label={appLabels.ficheSecteursReglementaires}
      value={
        <FicheSecteursList
          isLoading={isLoading}
          secteurs={isError ? { etat: 'en_cours_de_calcul' } : data}
        />
      }
      isReadonly
      renderOnEdit={() => null}
    />
  );
};
