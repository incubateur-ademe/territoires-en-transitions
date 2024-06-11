import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {referentielToName} from 'app/labels';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLieesCards';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {TIndicateurPredefini} from '../types';
import {FichesActionLiees} from '../FichesActionLiees';
import {IndicateurInfoLiees} from './IndicateurInfoLiees';
import {useIndicateurImportSources} from './useImportSources';
import {ImportSourcesSelector} from './ImportSourcesSelector';
import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/detail/IndicateurDetailChart';
import {Badge, Field} from '@tet/ui';

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

      <div className="flex items-center mt-10 mb-6 gap-4">
        <BadgeACompleter a_completer={!definition.rempli} />
        {definition.participation_score && (
          <Badge
            title={`Participe au score ${referentielToName.cae}`}
            uppercase={false}
            state="grey"
          />
        )}
      </div>
      <IndicateurValuesTabs
        definition={definition}
        importSource={currentSource}
      />
      <div className="flex flex-col gap-8 mt-10">
        <IndicateurInfoLiees definition={definition} />
        {
          /** actions liées */
          action_ids?.length ? (
            <Field
              title={action_ids.length > 1 ? 'Actions liées' : 'Action liée'}
            >
              <ActionsLieesCards actions={action_ids} />
            </Field>
          ) : null
        }
        <FichesActionLiees definition={definition} />
      </div>
    </>
  );
};
