import { ActionCard } from '@/app/referentiels/actions/action.card';
import {
  ActionListFilters,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { EmptyCard } from '@tet/ui';
import classNames from 'classnames';
import { DisplayOption } from './action.list';
import Axe from './axe';
import { buildReferentiel } from './utils';

type Props = {
  filters: ActionListFilters;
  toggleFilters: () => void;
  display?: DisplayOption;
  showDescriptionOn: boolean;
};

const List = ({
  filters,
  toggleFilters,
  display = 'action',
  showDescriptionOn,
}: Props) => {
  const { data: actionList, isLoading: isLoadingActions } = useListActions({
    ...filters,
    actionTypes:
      display === 'axe'
        ? [ActionTypeEnum.AXE, ActionTypeEnum.SOUS_AXE, ActionTypeEnum.ACTION]
        : [ActionTypeEnum.ACTION],
  });

  if (isLoadingActions)
    return (
      <div className="flex justify-center items-center h-80">
        <SpinnerLoader />
      </div>
    );

  if (!actionList) return <div className="min-h-80" />;

  if (actionList.length === 0) {
    return (
      <EmptyCard
        picto={(props) => <PictoDocument {...props} />}
        title="Aucun résultat pour ce filtre !"
        className="mt-6"
        actions={[
          {
            children: 'Modifier le filtre',
            onClick: toggleFilters,
            size: 'sm',
          },
        ]}
      />
    );
  }

  if (display === 'axe') {
    return (
      <div className="flex flex-col">
        {buildReferentiel(actionList).map((axe) => (
          <Axe
            key={axe.actionId}
            axe={{ ...axe, nom: `${axe.identifiant} - ${axe.nom}` }}
            showDescription={showDescriptionOn}
          />
        ))}
      </div>
    );
  }

  if (display === 'action') {
    return (
      <div
        className={classNames('grid grid-cols-1 gap-5 grid-rows-1 mt-6', {
          'md:grid-cols-2 lg:grid-cols-3': !showDescriptionOn,
        })}
      >
        {actionList
          .filter((action) => action.actionType === 'action')
          .map((action) => (
            <ActionCard
              key={action.actionId}
              action={action}
              showDescription={showDescriptionOn}
            />
          ))}
      </div>
    );
  }
};

export default List;
