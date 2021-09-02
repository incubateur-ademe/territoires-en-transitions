import {avancementLabels} from 'app/labels';
import * as R from 'ramda';
import type {Avancement, Option, Options} from 'types';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';
import {useActionStatus} from 'core-logic/hooks/actionStatus';
import {commands} from 'core-logic/commands';
import {ActionStatusStorable} from 'storables/ActionStatusStorable';
import {useEpciId} from 'core-logic/hooks';

export const ActionStatusAvancementRadioButton = ({
  actionId,
}: {
  actionId: string;
}) => {
  const epciId = useEpciId()!;

  const avancements: Options<Avancement> = R.values(
    R.mapObjIndexed((label, value) => ({value, label}), avancementLabels)
  );

  const actionStatusStorableId = ActionStatusStorable.buildId(epciId, actionId);
  const avancement = useActionStatus(actionStatusStorableId)?.avancement ?? '';

  const optionIsChecked = ({option}: {option: Option<Avancement>}) =>
    option.value === avancement;

  const onClick = async ({option}: {option: Option<Avancement>}) => {
    const checked = optionIsChecked({option});
    const avancement = checked ? '' : option.value;
    await commands.referentielCommands.storeActionStatusAvancement(
      new ActionStatusStorable({
        epci_id: epciId,
        avancement,
        action_id: actionId,
      })
    );
  };
  return (
    <AvancementRadioButton
      avancements={avancements}
      optionIsChecked={optionIsChecked}
      onClick={onClick}
    />
  );
};
