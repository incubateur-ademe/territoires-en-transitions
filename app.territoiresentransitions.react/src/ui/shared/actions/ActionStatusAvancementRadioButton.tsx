import {useActions, useAppState} from 'core-logic/overmind';
import {avancementLabels} from 'app/labels';
import * as R from 'ramda';
import type {Avancement, Option, Options} from 'types';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';

export const ActionStatusAvancementRadioButton = ({
  actionId,
}: {
  actionId: string;
}) => {
  const avancements: Options<Avancement> = R.values(
    R.mapObjIndexed((label, value) => ({value, label}), avancementLabels)
  );
  const avancement =
    useAppState().actionReferentielStatusAvancementById[actionId];
  const optionIsChecked = ({option}: {option: Option<Avancement>}) =>
    option.value === avancement;

  const actions = useActions();
  const onClick = async ({option}: {option: Option<Avancement>}) => {
    const checked = optionIsChecked({option});
    const avancement = checked ? '' : option.value;
    await actions.referentiels.updateActionReferentielAvancement({
      actionId,
      avancement: avancement,
    });
  };
  return (
    <AvancementRadioButton
      avancements={avancements}
      optionIsChecked={optionIsChecked}
      onClick={onClick}
    />
  );
};
