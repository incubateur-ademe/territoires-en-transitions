import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Divider, VisibleWhen } from '@tet/ui';
import { useFicheContext } from '../context/fiche-context';
import { Breadcrumbs } from './breadcrumbs';
import { EditionModalManagerProvider } from './context/edition-modal-manager-context';
import { EditionModalRenderer } from './context/edition-modal-renderer';
import { EditableTitle } from './editable-title';
import { Menu } from './menu';
import { SubHeader } from './subheader';

export const Header = () => {
  const { fiche, isReadonly, planId, update } = useFicheContext();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { titre, axes } = fiche;

  const updateTitle = (titre: string | null) =>
    update({
      ficheId: fiche.id,
      ficheFields: { titre },
    });

  return (
    <EditionModalManagerProvider>
      <div className="w-full" data-test="fiche-header">
        <div className="flex gap-4 flex-row lg:items-start mb-3">
          <div className="flex-1">
            <EditableTitle
              title={titre}
              isReadonly={isReadonly}
              onUpdate={updateTitle}
            />
          </div>

          <Menu />
        </div>

        <VisibleWhen condition={hasCollectivitePermission('plans.read')}>
          <Breadcrumbs
            title={titre ?? 'Sans titre'}
            collectiviteId={collectiviteId}
            axes={axes ?? []}
            planId={planId}
          />
        </VisibleWhen>
        <Divider color="primary" className="my-3" />
        <SubHeader fiche={fiche} collectiviteId={collectiviteId} />
        <Divider color="primary" className="mt-3" />
      </div>
      <EditionModalRenderer fiche={fiche} planId={planId} />
    </EditionModalManagerProvider>
  );
};
