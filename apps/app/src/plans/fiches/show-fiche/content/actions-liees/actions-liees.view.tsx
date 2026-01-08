import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button, VisibleWhen } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { useFicheSidePanel } from '../use-fiche-side-panel';
import { useActionsLieesViewSwitcher } from './actions-liees-view-switcher';
import { FicheActionCard } from './card/fiche-action.card';
import { FichePicto } from './fiche.picto';

export const ActionsLieesView = () => {
  const { fiche, isReadonly, actionsLiees } = useFicheContext();
  const { openPanel } = useFicheSidePanel();
  const collectivite = useCurrentCollectivite();
  const user = useUser();

  const { view, viewSwitcherComponent } = useActionsLieesViewSwitcher();
  const handleUnlink = (ficheId: number) =>
    actionsLiees.update(
      actionsLiees.list.filter((f) => f.id !== ficheId).map((f) => f.id)
    );

  return (
    <ContentLayout.Root>
      <ContentLayout.SharedAlert
        fiche={fiche}
        collectiviteId={collectivite.collectiviteId}
        title="Actions associées"
        description="Les actions affichées correspondent à celles de cette collectivité."
      />
      <ContentLayout.Empty
        isReadonly={isReadonly}
        picto={(props) => <FichePicto {...props} />}
        title="Cette action n'est liée à aucune autre action"
        subTitle="Lier des actions pour les regrouper et faciliter leur gestion"
        actions={[
          {
            children: 'Lier une action',
            icon: 'link',
            onClick: () => openPanel('actions-liees', fiche),
          },
        ]}
      />
      <ContentLayout.Content
        data={actionsLiees.list}
        isLoading={actionsLiees.isLoading}
        actions={
          <div className="flex gap-4 items-center">
            {viewSwitcherComponent}
            <VisibleWhen condition={!isReadonly}>
              <Button
                icon="link"
                size="sm"
                onClick={() => openPanel('actions-liees', fiche)}
              >
                Lier une action
              </Button>
            </VisibleWhen>
          </div>
        }
      >
        {view === 'grid' ? (
          (fiche) => (
            <FicheActionCard
              key={fiche.id}
              ficheAction={fiche}
              completion={fiche.completion}
              isEditable={false}
              onUnlink={!isReadonly ? () => handleUnlink(fiche.id) : undefined}
              link={makeCollectiviteActionUrl({
                collectiviteId: collectivite?.collectiviteId,
                ficheUid: fiche.id.toString(),
              })}
              currentCollectivite={collectivite}
              currentUserId={user.id}
            />
          )
        ) : (
          <FichesListTable
            collectivite={collectivite}
            fiches={actionsLiees.list}
            isLoading={false}
            isGroupedActionsOn={false}
            enableSelection={false}
            onUnlink={!isReadonly ? handleUnlink : undefined}
          />
        )}
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
