import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {useIndicateur} from './useIndicateurDefinitions';
import {HeaderIndicateur} from './Header';
import {IndicateurDetail} from './detail/IndicateurDetail';
import {IndicateurCompose} from './detail/IndicateurCompose';
import {IndicateurSidePanelToolbar} from './IndicateurSidePanelToolbar';

/** Charge et affiche le détail d'un indicateur prédéfini et de ses éventuels "enfants" */
export const IndicateurPredefini = ({indicateurId}: {indicateurId: string}) => {
  const definition = useIndicateur(indicateurId);
  if (!definition) return null;

  return (
    <>
      <HeaderIndicateur title={definition.nom} />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <IndicateurSidePanelToolbar definition={definition} />
        </div>
        {/** affiche les indicateurs "enfants" */}
        {definition.enfants?.length ? (
          <IndicateurCompose definition={definition} />
        ) : (
          /** ou juste le détail si il n'y a pas d'enfants */
          <IndicateurDetail definition={definition} />
        )}
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};
