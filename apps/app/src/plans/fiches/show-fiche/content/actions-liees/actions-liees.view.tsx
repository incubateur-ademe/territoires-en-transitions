import { appLabels } from '@/app/labels/catalog';
import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, VisibleWhen } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { useFicheSidePanel } from '../use-fiche-side-panel';
import { FichePicto } from './fiche.picto';

export const ActionsLieesView = () => {
  const { fiche, isReadonly, actionsLiees } = useFicheContext();
  const { openPanel } = useFicheSidePanel();
  const collectivite = useCurrentCollectivite();

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
          <VisibleWhen condition={!isReadonly}>
            <Button
              icon="link"
              size="xs"
              onClick={() => openPanel('actions-liees', fiche)}
            >
              {appLabels.lierAction}
            </Button>
          </VisibleWhen>
        }
      >
        <FichesListTable
          collectivite={collectivite}
          fiches={actionsLiees.list}
          isLoading={false}
          isGroupedActionsOn={false}
          enableSelection={false}
          onUnlink={!isReadonly ? handleUnlink : undefined}
        />
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
