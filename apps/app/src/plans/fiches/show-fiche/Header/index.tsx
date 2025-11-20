import { useCollectiviteId } from '@/api/collectivites';
import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { FicheWithRelations } from '@/domain/plans';
import { PermissionOperation } from '@/domain/users';
import { Divider, Icon } from '@/ui';
import { format } from 'date-fns';
import { FicheActionCompletionStatus } from '../FicheActionCompletion/fiche-action-completion';
import Toolbar from './actions/toolbar';
import { FicheBreadcrumbs } from './fiche-breadcrumbs';
import TitreFiche from './TitreFiche';

type FicheActionHeaderProps = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  permissions: PermissionOperation[];
  updateTitle: (value: string | null) => void;
  planId?: number;
};

export const Header = ({
  fiche,
  updateTitle,
  isReadonly,
  permissions,
  planId,
}: FicheActionHeaderProps) => {
  const {
    titre,
    axes,
    modifiedBy,
    modifiedAt,
    createdBy,
    createdAt,
    completion,
  } = fiche;

  const collectiviteId = useCollectiviteId();

  const displayCreationInfo = createdBy || createdAt;
  const displayModificationInfo =
    (modifiedBy || modifiedAt) && modifiedAt !== createdAt;
  const displayCompletionInfo = !!completion;

  const displayInfoSection = displayCreationInfo || displayModificationInfo;

  const onDeleteRedirectPath = planId
    ? makeCollectivitePlanActionUrl({
        collectiviteId: collectiviteId,
        planActionUid: planId.toString(),
      })
    : makeCollectiviteToutesLesFichesUrl({
        collectiviteId: collectiviteId,
      });
  return (
    <div className="w-full mb-6" data-test="fiche-header">
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
        {/* Titre éditable de la fiche action */}
        <TitreFiche
          titre={titre}
          isReadonly={isReadonly}
          updateTitle={updateTitle}
        />

        {/* Actions génériques de la fiche action */}
        <Toolbar
          fiche={fiche}
          permissions={permissions}
          collectiviteId={collectiviteId}
          onDeleteRedirectPath={onDeleteRedirectPath}
        />
      </div>

      {/* Fils d'ariane avec emplacements de la fiche */}
      {hasPermission(permissions, 'plans.read') && (
        <FicheBreadcrumbs
          titre={titre ?? 'Sans titre'}
          collectiviteId={collectiviteId}
          axes={axes ?? []}
          planId={planId}
        />
      )}

      {/* Infos de création, de modification et de complétion la fiche */}
      {displayInfoSection ? (
        <div className="flex max-md:flex-col gap-3 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y border-primary-3">
          {displayModificationInfo && (
            <span>
              <Icon icon="calendar-2-line" size="sm" className="mr-1" />
              Modifiée{' '}
              {modifiedAt
                ? `le ${format(new Date(modifiedAt), 'dd/MM/yyyy')}`
                : ''}{' '}
              {modifiedBy ? `par ${modifiedBy?.prenom} ${modifiedBy?.nom}` : ''}
            </span>
          )}

          {displayCreationInfo && (
            <>
              {displayModificationInfo && (
                <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
              )}
              <span>
                <Icon icon="file-add-line" size="sm" className="mr-1" />
                Créée{' '}
                {createdAt
                  ? `le ${format(new Date(createdAt), 'dd/MM/yyyy')}`
                  : ''}{' '}
                {createdBy
                  ? `par ${fiche.createdBy?.prenom} ${createdBy?.nom}`
                  : ''}
              </span>
            </>
          )}

          {displayCompletionInfo && (
            <>
              {(displayCreationInfo || displayModificationInfo) && (
                <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
              )}
              <FicheActionCompletionStatus completion={completion} />
            </>
          )}
        </div>
      ) : (
        <Divider className="mt-4" />
      )}
    </div>
  );
};
