import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { ActionCard } from '@/app/referentiels/actions/action.card';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import { PictoEtatDesLieuxMonochrome } from '@/app/ui/pictogrammes/PictoEtatDesLieuxMonochrome';
import { ModuleMesuresSelect } from '@tet/api/plan-actions';
import { ButtonProps, MenuAction } from '@tet/ui';

type Props = {
  module: ModuleMesuresSelect;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: MenuAction[];
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
};

export const MesuresModule = ({ module, menuActions, emptyButtons }: Props) => {
  const { data, isLoading } = useListActions(module.options.filtre);

  const mesures = data || [];
  const totalCount = mesures?.length || 0;

  return (
    <Module
      title={module.titre}
      filters={module.options.filtre}
      menuActions={menuActions}
      symbole={<PictoEtatDesLieuxMonochrome className="w-16 h-16" />}
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
                    ? '1 autre mesure'
                    : `les ${totalCount - 4} autres mesures`
                }`,
                href: makeTdbCollectiviteUrl({
                  collectiviteId: module.collectiviteId,
                  view: 'personnel',
                  module: module.defaultKey,
                }),
              },
            ]
          : []
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {mesures?.slice(0, 4).map((mesure) => (
          <ActionCard key={mesure.actionId} action={mesure} />
        ))}
      </div>
    </Module>
  );
};
