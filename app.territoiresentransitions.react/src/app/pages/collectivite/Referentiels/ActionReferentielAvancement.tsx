import {actions as referentielActions} from 'generated/data/referentiels';
import {Link} from 'react-router-dom';
import {
  ActionReferentielAvancementRecursiveCard,
  ActionReferentielTitle,
  ProgressStatStatic,
} from 'ui/referentiels';
import 'app/DesignSystem/buttons.css';
import {AddFicheActionButton, Spacer} from 'ui/shared';
import {isIndicateurRelatedToAction} from 'utils/indicateurs';
import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {IndicateurReferentielCard} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielCard';
import {DescriptionContextAndRessourcesDialogButton} from './_DescriptionContextAndRessourcesDialogButton';
import {OrientationQuickNav} from 'app/pages/collectivite/Referentiels/QuickNav';
import {searchActionById} from 'utils/actions';

const ActionReferentielAvancement = ({actionId}: {actionId: string}) => {
  const action = searchActionById(actionId, referentielActions);
  if (!action) {
    return <Link to="./referentiels" />;
  }
  const relatedIndicateurs = indicateurs.filter(indicateur =>
    isIndicateurRelatedToAction(indicateur, action)
  );
  return (
    <div className="fr-container">
      <div className="mt-8 mb-16">
        <OrientationQuickNav action={action} />
        <div className="pt-8 flex justify-between items-center">
          <ActionReferentielTitle
            className="fr-h1 mb-3 w-9/12 text-gray-900"
            action={action}
          />
          <AddFicheActionButton actionId={action.id} />
        </div>
        <ProgressStatStatic
          action={action}
          position="left"
          className="w-full mb-10"
          showPoints={true}
        />
        <div className="w-2/3">
          <DescriptionContextAndRessourcesDialogButton action={action} />
        </div>
      </div>

      <section>
        <h2 className="fr-h2"> Les actions</h2>
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
        {relatedIndicateurs.length === 0 && (
          <p>Cette action ne comporte pas d'indicateur</p>
        )}

        {relatedIndicateurs.map(indicateur => (
          <IndicateurReferentielCard
            key={indicateur.id}
            indicateur={indicateur}
          />
        ))}
      </section>
    </div>
  );
};

export default ActionReferentielAvancement;
