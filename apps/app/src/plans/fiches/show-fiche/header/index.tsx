import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { VisibleWhen } from '@tet/ui';
import { useFicheContext } from '../context/fiche-context';
import { Breadcrumbs } from './breadcrumbs';
import { EditionModalManagerProvider } from './context/edition-modal-manager-context';
import { EditionModalRenderer } from './context/edition-modal-renderer';
import { EditableTitle } from './editable-title';
import { Menu } from './menu';
import { SubHeader } from './subheader';

const Divider = () => {
  return <div className="border-b bg-primary-3 my-3" />;
};

export const Header = () => {
  const { fiche, isReadonly, planId, update } = useFicheContext();
  const { collectiviteId, permissions } = useCurrentCollectivite();
  const { titre, axes } = fiche;

  const updateTitle = (titre: string | null) =>
    update({
      ficheId: fiche.id,
      ficheFields: { titre },
    });

  return (
    <EditionModalManagerProvider>
      <div className="w-full mb-6" data-test="fiche-header">
        <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <EditableTitle
              title={titre}
              isReadonly={isReadonly}
              onUpdate={updateTitle}
            />
          </div>

          <Menu permissions={permissions} />
        </div>

        <VisibleWhen condition={hasPermission(permissions, 'plans.read')}>
          <Breadcrumbs
            title={titre ?? 'Sans titre'}
            collectiviteId={collectiviteId}
            axes={axes ?? []}
            planId={planId}
          />
          <Divider />
        </VisibleWhen>
        <SubHeader fiche={fiche} collectiviteId={collectiviteId} />
        <EditionModalRenderer fiche={fiche} planId={planId} />
      </div>
    </EditionModalManagerProvider>
  );
};
