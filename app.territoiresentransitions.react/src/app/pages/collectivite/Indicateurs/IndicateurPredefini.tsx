import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {useIndicateur, useIndicateursEnfants} from './useIndicateurDefinitions';
import {IndicateurSidePanel} from './IndicateurSidePanel';
import {HeaderIndicateur} from './Header';
import {IndicateurDetail} from './detail/IndicateurDetail';
import {IndicateurCompose} from './detail/IndicateurCompose';

/** Charge et affiche le détail d'un indicateur prédéfini et de ses éventuels "enfants" */
export const IndicateurPredefini = ({indicateurId}: {indicateurId: string}) => {
  const definition = useIndicateur(indicateurId);
  const enfants = useIndicateursEnfants(indicateurId);
  if (!definition) return null;

  return (
    <>
      <HeaderIndicateur title={definition.nom} />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <IndicateurSidePanel definition={definition} />
        </div>
        {/** affiche les indicateurs "enfants" */}
        {enfants.length ? (
          <IndicateurCompose definition={definition} enfants={enfants} />
        ) : (
          /** ou juste le détail si il n'y a pas d'enfants */
          <IndicateurDetail definition={definition} />
        )}
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};
