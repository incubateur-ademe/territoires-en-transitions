import {Tab, Tabs} from '@dataesr/react-dsfr';
import {Switch} from '@material-ui/core';
import {IndicateurReferentielCard} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielCard';
import {OrientationQuickNav} from 'app/pages/collectivite/Referentiels/QuickNav';
import {indicateurActionReadEndpoint} from 'core-logic/api/endpoints/IndicateurActionReadEndpoint';
import {useAllIndicateurDefinitions} from 'core-logic/hooks/indicateur_definition';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {actions as referentielActions} from 'generated/data/referentiels';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ActionReferentiel} from 'types/action_referentiel';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielAvancementRecursiveCard} from 'ui/referentiels/ActionReferentielAvancementRecursiveCard';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {Spacer} from 'ui/shared/Spacer';
import {searchActionById} from 'utils/actions';
import {addTargetToContentAnchors} from 'utils/content';
import {sortIndicateurDefinitionsByIdentifiant} from 'utils/indicateurs';
import {DescriptionContextAndRessourcesDialogButton} from './_DescriptionContextAndRessourcesDialogButton';

const useActionLinkedIndicateurDefinitions = (actionId: string) => {
  const [linkedIndicateurDefinitions, setLinkedIndicateurDefinitions] =
    useState<IndicateurDefinitionRead[]>([]);

  const allIndicateurDefinitions = useAllIndicateurDefinitions();
  useEffect(() => {
    indicateurActionReadEndpoint.getBy({}).then(allIndicateurActions => {
      const linkedIndicateurDefinitions = allIndicateurActions
        .filter(indicateurAction => indicateurAction.action_id === actionId)
        .map(linkedIndicateurAction =>
          allIndicateurDefinitions.find(
            indicateurDefinition =>
              indicateurDefinition.id === linkedIndicateurAction.indicateur_id
          )
        );

      setLinkedIndicateurDefinitions(
        linkedIndicateurDefinitions.filter(
          definition => !!definition
        ) as IndicateurDefinitionRead[]
      );
    });
  }, [allIndicateurDefinitions]);
  return sortIndicateurDefinitionsByIdentifiant(linkedIndicateurDefinitions);
};

const ActionReferentielAvancement = ({actionId}: {actionId: string}) => {
  const action = searchActionById(actionId, referentielActions);
  const [showOnlyActionWithData, setShowOnlyActionWithData] = useState(false);

  const isFullyRenseigne = (action: ActionReferentiel): boolean => {
    const actionScore = scoreBloc.getScore(action.id, action.referentiel);
    return !!actionScore && actionScore.point_non_renseigne === 0;
  };

  if (!action) {
    return <Link to="./referentiels" />;
  }
  const actionLinkedIndicateurDefinitions =
    useActionLinkedIndicateurDefinitions(actionId);

  return (
    <div className="fr-container">
      <div className="mt-8 mb-4">
        <OrientationQuickNav action={action} />
      </div>
      <div className="sticky top-0 z-40 flex flex-row justify-between bg-white pr-8 items-center">
        <div className="flex flex-col w-4/5">
          <ActionReferentielDisplayTitle action={action} />
        </div>
        <div className="w-1/6">
          <ActionProgressBar actionId={action.id} scoreBloc={scoreBloc} />
        </div>
      </div>
      <div className="mb-16">
        <div className="flex flex-col w-4/5">
          <div
            className="htmlContent"
            dangerouslySetInnerHTML={{
              __html: addTargetToContentAnchors(action.description ?? ''),
            }}
          />
          <DescriptionContextAndRessourcesDialogButton action={action} />
          <Spacer size={1} />
          <ActionCommentaire action={action} />
        </div>
      </div>

      <Tabs>
        <Tab label="Actions">
          <section>
            <div className="flex items-center fr-text--sm fr-m-0">
              Afficher uniquement les actions non-renseignées
              <Switch
                color="primary"
                checked={showOnlyActionWithData}
                inputProps={{'aria-label': 'controlled'}}
                onChange={() => {
                  setShowOnlyActionWithData(!showOnlyActionWithData);
                }}
              />
            </div>
            {action.actions.map(action => {
              if (showOnlyActionWithData && isFullyRenseigne(action)) {
                return null;
              }
              return (
                <ActionReferentielAvancementRecursiveCard
                  action={action}
                  key={action.id}
                  displayAddFicheActionButton={true}
                  displayProgressStat={true}
                />
              );
            })}
          </section>
        </Tab>
        <Tab label="Indicateurs">
          <section>
            {actionLinkedIndicateurDefinitions.length === 0 && (
              <p>Cette action ne comporte pas d'indicateur.</p>
            )}

            {actionLinkedIndicateurDefinitions.map(definition => (
              <IndicateurReferentielCard
                key={definition.id}
                definition={definition}
              />
            ))}
          </section>
        </Tab>
      </Tabs>
    </div>
  );
};

export default ActionReferentielAvancement;
