import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {thematiques} from 'generated/data/thematiques';
import * as R from 'ramda';

import 'app/pages/Epci/Referentiels/ArrowExpandable.css';
import {ActionReferentielTitleCard} from 'ui/referentiels';

const ThematiqueSectionCombined = ({
  eciActions,
  caeActions,
  thematiqueName,
}: {
  eciActions: ActionReferentiel[];
  caeActions: ActionReferentiel[];
  thematiqueName: string;
}) => {
  return (
    <div className="mb-2 ml-4 ArrowExpandable">
      <details>
        <summary className="flex items-center">
          <div>
            <h3>
              {thematiqueName}
              <span
                className="fr-fi-arrow-right-s-line ml-10 text-xl"
                aria-hidden={true}
              ></span>
            </h3>
          </div>
        </summary>
        <div className="mt-8 ml-4 mb-6">
          {eciActions.map(action => (
            <ActionReferentielTitleCard
              key={action.id}
              action={action}
              referentiel="eci"
            />
          ))}
          {caeActions.map(action => (
            <ActionReferentielTitleCard
              key={action.id}
              action={action}
              referentiel="cae"
            />
          ))}
        </div>
      </details>
    </div>
  );
};

export const ReferentielCombinedByThematique = ({
  caeActions,
  eciActions,
}: {
  caeActions: ActionReferentiel[];
  eciActions: ActionReferentiel[];
}) => {
  const eciActionsGroupedByThematique = R.groupBy(
    action => action.thematique_id,
    eciActions
  );
  const caeActionsGroupedByThematique = R.groupBy(
    action => action.thematique_id,
    caeActions
  );
  return (
    <section>
      {thematiques.map(thematique => (
        <ThematiqueSectionCombined
          key={thematique.id}
          thematiqueName={thematique.name}
          eciActions={eciActionsGroupedByThematique[thematique.id] ?? []}
          caeActions={caeActionsGroupedByThematique[thematique.id] ?? []}
        />
      ))}
    </section>
  );
};
