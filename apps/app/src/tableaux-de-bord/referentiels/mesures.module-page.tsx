import { ModuleMesuresSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { referentielToName } from '@/app/app/labels';
import { ActionCard } from '@/app/referentiels/actions/action.card';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';
import FilterBadges, { useFiltersToBadges } from '@/app/ui/lists/filter-badges';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ActionTypeEnum, ReferentielId } from '@/domain/referentiels';
import { Button, EmptyCard } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type Props = {
  module: ModuleMesuresSelect;
  parentPage: ModuleParentPage;
  filtersModal: (openState: OpenState) => React.ReactNode;
};

export const MesuresModulePage = ({
  module,
  parentPage,
  filtersModal,
}: Props) => {
  const { titre, options } = module;

  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useListActions({
    ...options.filtre,
    actionTypes: [ActionTypeEnum.ACTION],
  });

  const mesures = data || [];

  const { data: filterBadges } = useFiltersToBadges({
    filters: options.filtre,
  });

  const getBadgesReferentiels = (referentiels?: ReferentielId[]): string[] => {
    if (!referentiels || referentiels.length === 0) {
      return [];
    }
    return referentiels.map((referentiel) => referentielToName[referentiel]);
  };

  return (
    <ModulePage title={titre} parentPage={parentPage}>
      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : (
        /** Liste des mesures */
        <>
          <div className="flex gap-6 py-4 border-y border-primary-3">
            <Button
              className="ml-auto"
              variant="outlined"
              size="sm"
              icon="equalizer-line"
              onClick={() => setIsOpen(true)}
            >
              Filtrer
            </Button>
            {filtersModal({ isOpen, setIsOpen })}
          </div>
          {filterBadges?.length && (
            <FilterBadges
              badges={[
                ...filterBadges,
                ...getBadgesReferentiels(options.filtre.referentielIds),
              ]}
            />
          )}
          {/** État vide */}
          {mesures?.length === 0 && (
            <EmptyCard
              picto={(props) => <PictoDocument {...props} />}
              title="Aucune mesure ne correspond à votre recherche"
              actions={[
                {
                  children: 'Modifier le filtre',
                  onClick: () => setIsOpen(true),
                },
              ]}
              variant="transparent"
            />
          )}
          <div className="grid grid-cols-1 gap-4 grid-rows-1 sm:grid-cols-2 lg:grid-cols-3">
            {mesures.map((action) => (
              <ActionCard key={action.actionId} action={action} />
            ))}
          </div>
        </>
      )}
    </ModulePage>
  );
};
