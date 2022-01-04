import {actions as referentielActions} from 'generated/data/referentiels';
import {Link} from 'react-router-dom';
import {
  ActionProgressBar,
  ActionReferentielAvancementRecursiveCard,
  ActionReferentielDisplayTitle,
} from 'ui/referentiels';
import 'app/DesignSystem/buttons.css';
import {Spacer} from 'ui/shared';
import {DescriptionContextAndRessourcesDialogButton} from './_DescriptionContextAndRessourcesDialogButton';
import {searchActionById} from 'utils/actions';
import {IndicateurReferentielCard} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielCard';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {indicateurActionReadEndpoint} from 'core-logic/api/endpoints/IndicateurActionReadEndpoint';
import {useEffect, useState} from 'react';
import {useAllIndicateurDefinitions} from 'core-logic/hooks/indicateur_definition';
import {OrientationFilAriane} from 'app/pages/collectivite/Referentiels/FilAriane';
import {addTargetToContentAnchors} from 'utils/content';

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
  return linkedIndicateurDefinitions;
};
const ActionReferentielAvancement = ({actionId}: {actionId: string}) => {
  const action = searchActionById(actionId, referentielActions);
  if (!action) {
    return <Link to="./referentiels" />;
  }
  const actionLinkedIndicateurDefinitions =
    useActionLinkedIndicateurDefinitions(actionId);

  return (
    <div className="fr-container">
      <div className="mt-8 mb-16">
        <OrientationFilAriane action={action} />
        <div className="pt-8 flex flex-row justify-between">
          <div className="flex flex-col">
            <ActionReferentielDisplayTitle action={action} />
            <div
              className="htmlContent"
              dangerouslySetInnerHTML={{
                __html: addTargetToContentAnchors(action.description ?? ''),
              }}
            />
            <DescriptionContextAndRessourcesDialogButton action={action} />
            <span className="bg-yellow-200">
              description génerale de l'avancement (champ commentaire)
            </span>
          </div>
          <ActionProgressBar action={action} scoreBloc={scoreBloc} />
        </div>
      </div>

      <span className="bg-yellow-200">onglets [actions/indicateurs]</span>

      <section>
        {action.actions.map(action => (
          <ActionReferentielAvancementRecursiveCard
            action={action}
            key={action.id}
            displayAddFicheActionButton={true}
            displayProgressStat={true}
          />
        ))}
      </section>

      <Spacer />
      <section>
        <h2 className="fr-h2">Les indicateurs</h2>
        {actionLinkedIndicateurDefinitions.length === 0 && (
          <p>Cette action ne comporte pas d'indicateur</p>
        )}

        {actionLinkedIndicateurDefinitions.map(definition => (
          <IndicateurReferentielCard
            key={definition.id}
            definition={definition}
          />
        ))}
      </section>
    </div>
  );
};

export default ActionReferentielAvancement;
