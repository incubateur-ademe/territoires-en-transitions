import { useCurrentCollectivite } from '@tet/api/collectivites';
import { cn, VisibleWhen } from '@tet/ui';
import { useFicheContext } from '../context/fiche-context';
import { Breadcrumbs } from './breadcrumbs';
import { EditionModalManagerProvider } from './context/edition-modal-manager-context';
import { EditionModalRenderer } from './context/edition-modal-renderer';
import { EditableTitle } from './editable-title';
import { Menu } from './menu';
import { SubHeader } from './subheader';

const Divider = ({ className }: { className?: string | undefined }) => {
  return <div className={cn('border-b bg-primary-3 my-3', className)} />;
};

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
        <Divider />
        <SubHeader fiche={fiche} collectiviteId={collectiviteId} />
        <Divider className="mb-0" />
      </div>
      <EditionModalRenderer fiche={fiche} planId={planId} />
    </EditionModalManagerProvider>
  );
};
