import { useCollectiviteId } from '@/api/collectivites';
import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
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
const FichesActionModule = ({
  module,
  menuActions,
  emptyButtons,
  footerLink,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const getSort = () => {
    if (module.defaultKey === 'actions-dont-je-suis-pilote') {
      return [{ field: 'titre' as const, direction: 'asc' as const }];
    }
    return [{ field: 'modified_at' as const, direction: 'desc' as const }];
  };

  const { data, isLoading } = useListFicheResumes({
    filters: {
      ...module.options.filtre,
    },
    queryOptions: {
      sort: getSort(),
      limit: 4,
    },
  });

  const fiches = data?.data || [];
  const totalCount = data?.count || 0;

  return (
    <Module
      title={module.titre}
      filters={module.options.filtre}
      menuActions={menuActions}
      symbole={<PictoExpert className="w-16 h-16" />}
      isLoading={isLoading}
      isEmpty={totalCount === 0}
      emptyButtons={emptyButtons}
      footerEndButtons={
        totalCount > 4
          ? [
              {
                variant: 'grey',
                size: 'sm',
                children: `Afficher ${
                  totalCount === 5
                    ? '1 autre action'
                    : `les ${totalCount - 4} autres actions`
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
            key={fiche.id}
            ficheAction={fiche}
            isEditable
            link={
              fiche.plans?.[0]?.id
                ? makeCollectivitePlanActionFicheUrl({
                    collectiviteId,
                    ficheUid: fiche.id.toString(),
                    planActionUid: fiche.plans[0].id.toString(),
                  })
                : makeCollectiviteFicheNonClasseeUrl({
                    collectiviteId,
                    ficheUid: fiche.id.toString(),
                  })
            }
          />
        ))}
      </div>
    </Module>
  );
};

export default FichesActionModule;
