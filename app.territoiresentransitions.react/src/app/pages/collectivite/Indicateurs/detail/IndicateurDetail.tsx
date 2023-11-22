import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {Badge} from 'ui/shared/Badge';
import FormField from 'ui/shared/form/FormField';
import {referentielToName} from 'app/labels';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLieesCards';
import IndicateurChart from '../charts/IndicateurChart';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {TIndicateurPredefini} from '../types';
import {FichesActionLiees} from '../FichesActionLiees';
import {IndicateurInfoLiees} from './IndicateurInfoLiees';

/**
 * Affiche le détail d'un indicateur sans enfant
 */
export const IndicateurDetail = ({
  definition,
}: {
  definition: TIndicateurPredefini;
}) => {
  const {action_ids} = definition;

  return (
    <>
      <IndicateurChart variant="zoomed" definition={definition} />
      <div className="flex items-center fr-mt-5w fr-mb-3w gap-4">
        <BadgeACompleter a_completer={!definition.rempli} />
        {definition.participation_score && (
          <Badge className="!normal-case" status="no-icon">
            Participe au score {referentielToName.cae}
          </Badge>
        )}
      </div>
      <IndicateurValuesTabs definition={definition} />
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
