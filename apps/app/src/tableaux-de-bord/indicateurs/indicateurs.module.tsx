import { useCollectiviteId } from '@/api/collectivites';
import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { listIndicateursParamsSerializer } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import {
  makeCollectiviteIndicateursCollectiviteUrl,
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
};

/** Module pour afficher des indicateurs en fonctions de filtres spécifiques */
export const IndicateursModule = ({
  module,
  menuActions,
  emptyButtons,
}: Props) => {
  const { titre, options } = module;

  const collectiviteId = useCollectiviteId();

  const { data: { data: indicateurs, count: totalCount = 0 } = {}, isLoading } =
    useListIndicateurDefinitions(
      {
        filters: module.options.filtre,
        queryOptions: {
          sort: [{ field: 'estRempli', direction: 'desc' }],
          limit: 3,
          page: 1,
        },
      },
      { disableAutoRefresh: false }
    );

  const getBottomLinks = () => {
    const links: ButtonProps[] = [
      {
        variant: 'grey',
        size: 'sm',
        children: 'Voir les indicateurs de la collectivité',
        href: makeCollectiviteIndicateursCollectiviteUrl({ collectiviteId }),
      },
    ];

    if (totalCount > 3) {
      links.push({
        size: 'sm',
        children: `Afficher ${
          totalCount === 4
            ? '1 autre indicateur'
            : `les ${totalCount - 3} autres indicateurs`
        }`,
        href: `${makeCollectiviteIndicateursListUrl({
          collectiviteId,
          listId: 'mes-indicateurs',
        })}${listIndicateursParamsSerializer({
          filter: options.filtre,
        })}`,
      });
    }

    return links;
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
            card={{ external: true }}
          />
        ))}
      </div>
    </Module>
  );
};
