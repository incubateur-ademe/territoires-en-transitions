import * as R from 'ramda';
import {fiche_action_avancement_noms} from 'generated/models/fiche_action_avancement_noms';
import './ActionStatusRadio.css';
import {useActions, useAppState} from 'core-logic/overmind';
import type {Avancement, Options} from 'types';

// TODO / Question : Fiche action and Ref actions have the same avancement options ?
export const ActionStatusRadio = ({actionId}: {actionId: string}) => {
  const avancements: Options<Avancement> = R.values(
    R.mapObjIndexed(
      (label, value) => ({value, label}),
      fiche_action_avancement_noms
    )
  );

  const avancement =
    useAppState().actionReferentielStatusAvancementById[actionId];

  const actions = useActions();

  return (
    <fieldset id={`actionStatusRadio-${actionId}`}>
      {avancements.map(option => {
        const checked = option.value === avancement;
        return (
          <div key={option.value} className="mx-1">
            <input
              value={option.value}
              name="actionStatusAvancement"
              type="radio"
            />
            <label
              className={`border rounded-l flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400 text-gray-700 ${
                checked ? 'checked' : ''
              }`}
              onClick={async () => {
                const avancement = checked ? '' : option.value;
                await actions.referentiels.updateActionReferentielAvancement({
                  actionId,
                  avancement: avancement,
                });
              }}
            >
              <span>{option.label}</span>
            </label>
          </div>
        );
      })}
    </fieldset>
  );
};
