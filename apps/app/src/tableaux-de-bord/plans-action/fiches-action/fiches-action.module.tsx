import { useCurrentCollectivite } from '@/api/collectivites';
import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { getFichePageUrlForCollectivite } from '@/app/plans/fiches/get-fiche/get-fiche-page-url.util';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { ButtonProps, MenuAction } from '@/ui';

type Props = {
  module: ModuleFicheActionsSelect;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: MenuAction[];
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
  /** URL de la page du module */
  footerLink?: string;
};

/** Module pour afficher des indicateurs en fonctions de filtres spécifiques */
export const FichesActionModule = ({
  module,
  menuActions,
  emptyButtons,
  footerLink,
}: Props) => {
  const collectivite = useCurrentCollectivite();

  const getSort = () => {
    if (module.defaultKey === 'actions-dont-je-suis-pilote') {
      return [{ field: 'titre' as const, direction: 'asc' as const }];
    }
    return [{ field: 'modified_at' as const, direction: 'desc' as const }];
  };

  const { fiches, count, isLoading } = useListFiches(
    collectivite.collectiviteId,
    {
      filters: {
        ...module.options.filtre,
      },
      queryOptions: {
        sort: getSort(),
        limit: 4,
        page: 1,
      },
    }
  );

  return (
    <Module
      title={module.titre}
      filters={module.options.filtre}
      menuActions={menuActions}
      symbole={<PictoExpert className="w-16 h-16" />}
      isLoading={isLoading}
      isEmpty={count === 0}
      emptyButtons={emptyButtons}
      footerEndButtons={
        count > 4
          ? [
              {
                variant: 'grey',
                size: 'sm',
                children: `Afficher ${
                  count === 5
                    ? '1 autre action'
                    : `les ${count - 4} autres actions`
                }`,
                href: footerLink,
              },
            ]
          : []
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {fiches.map((fiche) => (
          <FicheActionCard
            currentCollectivite={collectivite}
            key={fiche.id}
            ficheAction={fiche}
            isEditable
            link={getFichePageUrlForCollectivite({
              fiche,
              collectiviteId: collectivite.collectiviteId,
            })}
          />
        ))}
      </div>
    </Module>
  );
};
