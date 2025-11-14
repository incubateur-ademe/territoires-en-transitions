import { useCurrentCollectivite } from '@/api/collectivites';
import { ModuleIndicateursSelect } from '@/api/plan-actions';
import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { listIndicateursParamsSerializer } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import {
  IndicateursListParamOption,
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { useListIndicateurDefinitions } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ButtonProps, MenuAction } from '@/ui';

type Props = {
  module: ModuleIndicateursSelect;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: MenuAction[];
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];

  bottomLinkListId?: IndicateursListParamOption;
};

const MAX_DISPLAYED_INDICATEURS = 3;

/** Module pour afficher des indicateurs en fonctions de filtres spécifiques */
export const IndicateursModule = ({
  module,
  menuActions,
  emptyButtons,
  bottomLinkListId,
}: Props) => {
  const { titre, options } = module;

  const { collectiviteId } = useCurrentCollectivite();

  const { data: listIndicateursData, isLoading } = useListIndicateurDefinitions(
    {
      filters: module.options.filtre,
      queryOptions: {
        sort: [{ field: 'estRempli', direction: 'desc' }],
        limit: MAX_DISPLAYED_INDICATEURS,
        page: 1,
      },
    },
    { disableAutoRefresh: false }
  );

  const indicateurs = listIndicateursData?.data;
  const totalCount = listIndicateursData?.count || 0;

  const getBottomLinks = (): ButtonProps[] => {
    return totalCount >= MAX_DISPLAYED_INDICATEURS
      ? [
          {
            size: 'sm',
            variant: 'grey',
            children: `Afficher ${
              totalCount === MAX_DISPLAYED_INDICATEURS + 1
                ? '1 autre indicateur'
                : `les ${
                    totalCount - MAX_DISPLAYED_INDICATEURS
                  } autres indicateurs`
            }`,
            href: `${makeCollectiviteIndicateursListUrl({
              collectiviteId,
              listId: bottomLinkListId,
            })}${listIndicateursParamsSerializer({
              filter: options.filtre,
            })}`,
          },
        ]
      : [];
  };

  return (
    <Module
      title={titre}
      filters={options.filtre}
      menuActions={menuActions}
      symbole={<PictoDocument className="w-16 h-16" />}
      isLoading={isLoading}
      isEmpty={totalCount === 0}
      emptyButtons={emptyButtons}
      footerEndButtons={getBottomLinks()}
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {indicateurs?.map((definition) => (
          <IndicateurCard
            key={definition.id}
            definition={definition}
            href={makeCollectiviteIndicateursUrl({
              collectiviteId,
              indicateurView: getIndicateurGroup(
                definition.identifiantReferentiel
              ),
              indicateurId: definition.id,
              identifiantReferentiel: definition.identifiantReferentiel,
            })}
          />
        ))}
      </div>
    </Module>
  );
};
