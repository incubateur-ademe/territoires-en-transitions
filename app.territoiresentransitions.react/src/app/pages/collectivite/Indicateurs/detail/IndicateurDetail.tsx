import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {Badge} from 'ui/shared/Badge';
import FormField from 'ui/shared/form/FormField';
import {referentielToName} from 'app/labels';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLieesCards';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {TIndicateurPredefini} from '../types';
import {FichesActionLiees} from '../FichesActionLiees';
import {IndicateurInfoLiees} from './IndicateurInfoLiees';
import {useIndicateurImportSources} from './useImportSources';
import {ImportSourcesSelector} from './ImportSourcesSelector';

import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/detail/IndicateurDetailChart';

/**
 * Affiche le détail d'un indicateur sans enfant
 */
export const IndicateurDetail = ({
  definition,
}: {
  definition: TIndicateurPredefini;
}) => {
  const {id, action_ids} = definition;
  const {sources, currentSource, setCurrentSource} =
    useIndicateurImportSources(id);

  return (
    <>
      {!!sources?.length && (
        <ImportSourcesSelector
          definition={definition}
          sources={sources}
          currentSource={currentSource}
          setCurrentSource={setCurrentSource}
        />
      )}
      <IndicateurDetailChart
        definition={definition}
        rempli={definition.rempli}
        source={currentSource}
        titre={definition.titre_long}
        fileName={definition.nom}
      />

      <div className="flex items-center fr-mt-5w fr-mb-3w gap-4">
        <BadgeACompleter a_completer={!definition.rempli} />
        {definition.participation_score && (
          <Badge className="!normal-case" status="no-icon">
            Participe au score {referentielToName.cae}
          </Badge>
        )}
      </div>
      <IndicateurValuesTabs
        definition={definition}
        importSource={currentSource}
      />
      <div className="fr-mt-5w ">
        <IndicateurInfoLiees definition={definition} />
        {
          /** actions liées */
          action_ids?.length ? (
            <FormField
              className="fr-mb-1w"
              label={action_ids.length > 1 ? 'Actions liées' : 'Action liée'}
            >
              <ActionsLieesCards actions={action_ids} />
            </FormField>
          ) : null
        }
        <FichesActionLiees definition={definition} />
      </div>
    </>
  );
};
