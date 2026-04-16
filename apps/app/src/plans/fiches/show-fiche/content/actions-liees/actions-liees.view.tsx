import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
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
        title={appLabels.actionsAssociees}
        description={appLabels.actionsAssocieesDescription}
      />
      <ContentLayout.Empty
        isReadonly={isReadonly}
        picto={(props) => <FichePicto {...props} />}
        title={appLabels.actionsAssocieesEmptyTitle}
        subTitle={appLabels.actionsAssocieesEmptyDescription}
        actions={[
          {
            children: appLabels.lierAction,
            icon: 'link',
            onClick: () => openPanel('actions-liees', fiche),
          },
        ]}
      />
      <ContentLayout.Content
        data={actionsLiees.list}
        isLoading={actionsLiees.isLoading}
        actions={
          <>
            {viewSwitcherComponent}
            <VisibleWhen condition={!isReadonly}>
              <Button
                icon="link"
                size="sm"
                onClick={() => openPanel('actions-liees', fiche)}
              >
                {appLabels.lierAction}
              </Button>
            </VisibleWhen>
          </>
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
