import { useState } from 'react';

import ModifierFicheModale from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/ModifierFicheModale';
import {
  ficheSharedSingularAndPluralText,
  getFicheActionShareIcon,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';
import { cn, DEPRECATED_ButtonMenu, Icon } from '@/ui';

type Props = {
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellActions = ({ fiche }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isSharedWithCollectivites =
    fiche.sharedWithCollectivites && fiche.sharedWithCollectivites.length > 0;

  return (
    <>
      <DEPRECATED_ButtonMenu
        openState={{
          isOpen: isMenuOpen,
          setIsOpen: setIsMenuOpen,
        }}
        icon="more-2-line"
        variant="white"
        size="xs"
        menuPlacement="left"
      >
        <div className="max-w-56 flex flex-col p-2 border border-grey-2 rounded-md bg-white shadow]">
          <MenuItem
            icon="edit-2-line"
            onClick={() => {
              setIsEditOpen(true);
              setIsMenuOpen(false);
            }}
          >
            Modifier l&apos;action
          </MenuItem>
          <MenuItem
            icon="delete-bin-2-line"
            onClick={() => {
              setIsDeleteOpen(true);
              setIsMenuOpen(false);
            }}
          >
            Supprimer l&apos;action
          </MenuItem>
          {(isSharedWithCollectivites || fiche.restreint) && (
            <div className="flex flex-col gap-1 m-2 mb-0 pt-2 text-xs border-t border-grey-3">
              {fiche.sharedWithCollectivites && (
                <AdditionalMenuInfo
                  icon={getFicheActionShareIcon(fiche, fiche.collectiviteId)}
                  iconClassName="text-success"
                  label={`Partagée avec ${ficheSharedSingularAndPluralText(
                    fiche.sharedWithCollectivites
                  )}`}
                />
              )}
              {fiche.restreint && (
                <AdditionalMenuInfo
                  icon="lock-fill"
                  iconClassName="text-primary-7"
                  label="Fiche en accès restreint"
                />
              )}
            </div>
          )}
        </div>
      </DEPRECATED_ButtonMenu>
      <ModifierFicheModale
        initialFiche={fiche}
        isOpen={isEditOpen}
        setIsOpen={() => setIsEditOpen(!isEditOpen)}
      />
      <DeleteOrRemoveFicheSharingModal
        fiche={fiche}
        openState={{
          isOpen: isDeleteOpen,
          setIsOpen: setIsDeleteOpen,
        }}
        buttonClassName="hidden"
      />
    </>
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
    className="flex items-center gap-3 py-2 px-3 text-primary-9 text-sm text-left rounded hover:!bg-primary-1"
    onClick={onClick}
  >
    {icon && <Icon icon={icon} size="sm" className="-mt-0.5" />}
    {children}
  </button>
);
