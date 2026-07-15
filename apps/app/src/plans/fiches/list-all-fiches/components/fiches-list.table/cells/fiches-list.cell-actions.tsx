import { appLabels } from '@/app/labels/catalog';
import { useState } from 'react';

import {
  ficheSharedSingularAndPluralText,
  getFicheActionShareIcon,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { ButtonMenu, cn, Icon, IconValue, TableCell } from '@tet/ui';
import { RiDeleteBin6Line, RiLockFill, RiMore2Line } from '@remixicon/react';

type Props = {
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellActions = ({ fiche }: Props) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isSharedWithCollectivites =
    fiche.sharedWithCollectivites && fiche.sharedWithCollectivites.length > 0;

  const hasExtraInfo = isSharedWithCollectivites || fiche.restreint;

  return (
    <TableCell>
      <ButtonMenu
        icon={<RiMore2Line />}
        variant="white"
        size="xs"
        menu={{
          placement: 'left',
          className: 'max-w-56',
          actions: [
            {
              icon: <RiDeleteBin6Line />,
              label: appLabels.supprimerAction,
              onClick: () => {
                setIsDeleteOpen(true);
              },
            },
          ],
          endContent: hasExtraInfo && (
            <div className="flex flex-col gap-1 px-2 text-xs">
              {fiche.sharedWithCollectivites && (
                <AdditionalMenuInfo
                  icon={getFicheActionShareIcon(fiche, fiche.collectiviteId)}
                  iconClassName="text-success"
                  label={appLabels.partageeAvec({
                    collectivitesText: ficheSharedSingularAndPluralText(
                      fiche.sharedWithCollectivites
                    ),
                  })}
                />
              )}
              {fiche.restreint && (
                <AdditionalMenuInfo
                  icon={<RiLockFill />}
                  iconClassName="text-primary-7"
                  label={appLabels.actionAccesRestreint}
                />
              )}
            </div>
          ),
        }}
      />
      <DeleteOrRemoveFicheSharingModal
        fiche={fiche}
        openState={{
          isOpen: isDeleteOpen,
          setIsOpen: setIsDeleteOpen,
        }}
        buttonClassName="hidden"
      />
    </TableCell>
  );
};

const AdditionalMenuInfo = ({
  label,
  icon,
  iconClassName,
}: {
  label: string;
  icon?: IconValue;
  iconClassName?: string;
}) => (
  <div className="flex gap-1 text-grey-8">
    {icon && (
      <Icon
        icon={icon}
        size="xs"
        className={cn('text-[0.75rem]', iconClassName)}
      />
    )}
    <span>{label}</span>
  </div>
);
