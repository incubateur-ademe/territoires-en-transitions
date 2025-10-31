import { useState } from 'react';

import ModifierFicheModale from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/ModifierFicheModale';
import {
  getFicheActionShareIcon,
  getFicheActionShareText,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';
import { ButtonMenu, cn, Icon } from '@/ui';

type Props = {
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellActions = ({ fiche }: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isSharedWithCollectivites =
    fiche.sharedWithCollectivites && fiche.sharedWithCollectivites.length > 0;

  return (
    <ButtonMenu
      icon="more-2-line"
      variant="grey"
      size="xs"
      menuPlacement="left"
    >
      <div className="flex flex-col p-2 border border-grey-2 rounded-md bg-white shadow]">
        <MenuItem icon="edit-2-line" onClick={() => setIsEditOpen(true)}>
          Modifier l&apos;action
        </MenuItem>
        <MenuItem icon="delete-bin-2-line" onClick={() => null}>
          Supprimer l&apos;action
        </MenuItem>
        {(!isSharedWithCollectivites || !fiche.restreint) && (
          <div className="flex flex-col gap-1 m-2 mb-0 pt-2 text-xs border-t border-grey-3">
            {!isSharedWithCollectivites && (
              <AdditionalMenuInfo
                icon={getFicheActionShareIcon(fiche, fiche.collectiviteId)}
                iconClassName="text-success"
                label={getFicheActionShareText(fiche, fiche.collectiviteId)}
              />
            )}
            {!fiche.restreint && (
              <AdditionalMenuInfo
                icon="lock-fill"
                iconClassName="text-primary-7"
                label="Fiche en accès restreint"
              />
            )}
          </div>
        )}
      </div>
      <ModifierFicheModale
        initialFiche={fiche}
        isOpen={isEditOpen}
        setIsOpen={() => setIsEditOpen(!isEditOpen)}
      />
      <DeleteOrRemoveFicheSharingModal fiche={fiche} />
    </ButtonMenu>
  );
};

const AdditionalMenuInfo = ({
  label,
  icon,
  iconClassName,
}: {
  label: string;
  icon?: string;
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

const MenuItem = ({
  icon,
  children,
  onClick,
}: {
  icon?: string;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    className="flex items-center gap-3 py-2 px-3 font-medium text-primary-9 text-sm text-left rounded hover:!bg-primary-1"
    onClick={onClick}
  >
    {icon && <Icon icon={icon} size="sm" className="-mt-0.5" />}
    {children}
  </button>
);
