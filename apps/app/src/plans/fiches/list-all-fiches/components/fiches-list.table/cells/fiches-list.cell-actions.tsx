import { useState } from 'react';

import ModifierFicheModale from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/ModifierFicheModale';
import {
  ficheSharedSingularAndPluralText,
  getFicheActionShareIcon,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { ButtonMenu, cn, Icon } from '@tet/ui';

type Props = {
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellActions = ({ fiche }: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isSharedWithCollectivites =
    fiche.sharedWithCollectivites && fiche.sharedWithCollectivites.length > 0;

  return (
    <>
      <ButtonMenu
        icon="more-2-line"
        variant="white"
        size="xs"
        menu={{
          placement: 'left',
          className: 'max-w-56',
          actions: [
            {
              icon: 'edit-2-line',
              label: 'Modifier l’action',
              onClick: () => {
                setIsEditOpen(true);
              },
            },
            {
              icon: 'delete-bin-2-line',
              label: 'Supprimer l’action',
              onClick: () => {
                setIsDeleteOpen(true);
              },
            },
          ],
          endContent: (isSharedWithCollectivites || fiche.restreint) && (
            <div className="flex flex-col gap-1 px-2 text-xs">
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
                  label="Action en accès restreint"
                />
              )}
            </div>
          ),
        }}
      />
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
