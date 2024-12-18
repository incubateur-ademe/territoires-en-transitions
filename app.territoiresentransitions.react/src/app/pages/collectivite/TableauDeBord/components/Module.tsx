import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import { ModuleEditDeleteButtons } from '@/app/app/pages/collectivite/TableauDeBord/components/ModuleEditDeleteButtons';
import { getDisplayButtons } from '@/app/app/pages/collectivite/TableauDeBord/components/utils';
import FilterBadges, {
  BadgeFilters,
  useFiltersToBadges,
} from '@/app/ui/shared/filters/filter-badges';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { createEnumObject } from '@/domain/utils';
import {
  ActionsMenu,
  BottomOkCancel,
  ButtonGroup,
  InfoTooltip,
  MenuAction,
} from '@/ui';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';

export type ModuleDisplay = 'circular' | 'row';

export type ModuleDisplaySettings = {
  display: ModuleDisplay;
  setDisplay: (display: ModuleDisplay) => void;
  options?: ModuleDisplay[];
};

type Props = {
  /** Titre du module */
  title: string;

  /**
   * Texte à afficher quand on survole une icone d'info ajoutée à côté du titre.
   */
  titleTooltip?: string;

  /** Symbole du module (picto svg) */
  symbole?: React.ReactNode;
  /** Fonction d'affichage de la modale avec les filtres du modules,
   * à afficher au clique des boutons d'édition.
   * Récupère le state d'ouverture en argument */
  editModal?: (modalState: OpenState) => React.ReactNode;

  /**
   * Fonction appelée lors de la confirmation de suppression du module.
   */
  onDeleteConfirmed?: () => void;
  /** État de loading générique */
  isLoading: boolean;

  isError?: boolean;
  /** État vide générique */
  isEmpty: boolean;
  /** Filtre du module */
  filtre?: BadgeFilters;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActions pour un exemple) */
  children: React.ReactNode;
  /** Classe donnée au container afin d'appliquer par exemple
   *  le nombre de colonne à remplir dans la grille */
  className?: string;
  /** Des boutons optionnels dans un fragment qui s'affichent au pied du module */
  footerButtons?: React.ReactNode;
  /** Paramétrage de l'affichage des données */
  displaySettings?: ModuleDisplaySettings;
  /** Permet par exemple de donner une fonction de tracking */
  onSettingsClick?: () => void;

  /**
   * Fonction appelée lors du clic sur le bouton de téléchargement.
   */
  onDownloadClick?: () => void;
};

const moduleMenuOptionValues = ['delete', 'edit', 'download'] as const;
const ModuleMenuOptionEnum = createEnumObject(moduleMenuOptionValues);

/** Composant générique d'un module du tableau de bord plans d'action */
const Module = ({
  title,
  titleTooltip,
  filtre = {},
  symbole,
  editModal,
  onDeleteConfirmed,
  isLoading,
  isError,
  isEmpty,
  children,
  className,
  footerButtons,
  displaySettings,
  onSettingsClick,
  onDownloadClick,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const { count } = usePlanActionsCount();

  const { data: filterBadges } = useFiltersToBadges({
    filters: filtre,
    customValues: {
      planActions: filtre.planActionIds?.length === count && 'Tous les plans',
    },
  });

  const onDeleteButtonClicked = useCallback(() => {
    setIsConfirmDeleteOpen(true);
  }, []);

  const onEditButtonClicked = useCallback(() => {
    setIsEditModalOpen(true);
    onSettingsClick?.();
  }, [onSettingsClick]);

  const moduleOptions = useMemo<MenuAction[]>(() => {
    const options: MenuAction[] = [];
    if (editModal) {
      options.push({
        label: 'Modifier',
        icon: 'edit-line',
        onClick: onEditButtonClicked,
      });
    }
    if (onDeleteConfirmed) {
      options.push({
        label: 'Supprimer le module',
        icon: 'delete-bin-line',
        onClick: () => {
          onDeleteButtonClicked();
          // return true to keep the menu opened. Will be closed by the BottomOkCancel confirmation
          return true;
        },
      });
    }
    if (onDownloadClick) {
      options.push({
        label: 'Télécharger',
        icon: 'download-line',
        onClick: onDownloadClick,
      });
    }

    return options;
  }, [
    editModal,
    onDeleteConfirmed,
    onDeleteButtonClicked,
    onEditButtonClicked,
  ]);

  const renderEditModalDeleteAlert = useMemo(() => {
    return (
      <>
        {isConfirmDeleteOpen && (
          <BottomOkCancel
            title="Confirmer la suppression du module"
            btnOKProps={{
              onClick: () => {
                onDeleteConfirmed?.();
                setIsConfirmDeleteOpen(false);
              },
            }}
            btnCancelProps={{
              onClick: () => {
                setIsConfirmDeleteOpen(false);
              },
            }}
          />
        )}
        {editModal?.({
          isOpen: isEditModalOpen,
          setIsOpen: setIsEditModalOpen,
        })}
      </>
    );
  }, [onDeleteConfirmed, editModal, isEditModalOpen, isConfirmDeleteOpen]);

  if (isLoading) {
    return (
      <ModuleContainer className={className}>
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </ModuleContainer>
    );
  }

  if (isError) {
    return (
      <ModuleContainer
        className={classNames(
          '!gap-0 items-center text-center !bg-primary-0',
          className
        )}
      >
        <div className="mb-4">
          <PictoWarning />
        </div>
        <h6 className="mb-2 text-primary-8">
          Erreur lors du changement des données !
        </h6>
        <div className="w-full flex flex-col items-center gap-6">
          <p className={classNames('mb-0', 'text-primary-9')}>{title}</p>
          <FilterBadges
            maxDisplayedFilterCount={1}
            className="justify-center"
            badges={filterBadges}
          />
          <ModuleEditDeleteButtons
            onDeleteClicked={
              onDeleteConfirmed ? onDeleteButtonClicked : undefined
            }
            onEditClicked={editModal ? onEditButtonClicked : undefined}
          />
        </div>
        {renderEditModalDeleteAlert}
      </ModuleContainer>
    );
  }

  if (isEmpty) {
    return (
      <ModuleContainer
        className={classNames(
          '!gap-0 items-center text-center justify-center !bg-primary-0',
          className
        )}
      >
        <div className="mb-4">{symbole}</div>
        <h6 className="mb-2 text-primary-8">{title}</h6>
        <div className="w-full flex flex-col items-center gap-6">
          <p className="mb-0 text-primary-9">Aucun résultat pour ce filtre !</p>
          <FilterBadges
            maxDisplayedFilterCount={1}
            className="justify-center"
            badges={filterBadges}
          />
          <ModuleEditDeleteButtons
            onDeleteClicked={
              onDeleteConfirmed ? onDeleteButtonClicked : undefined
            }
            onEditClicked={editModal ? onEditButtonClicked : undefined}
          />
        </div>
        {renderEditModalDeleteAlert}
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer className={classNames('!border-grey-3', className)}>
      <div className="flex justify-between items-start gap-2">
        <h6 className="mb-0">
          {title}
          {titleTooltip ? (
            <InfoTooltip
              iconClassName="ml-2"
              label={
                <div className="max-w-sm !font-normal leading-none">
                  {titleTooltip}
                </div>
              }
            />
          ) : null}
        </h6>
        <>
          {/** Bouton d'édition des filtres du module + modale */}
          {(editModal || onDeleteConfirmed) && (
            <ActionsMenu actions={moduleOptions} />
          )}
        </>
      </div>
      {/** Filtres du module */}
      <FilterBadges maxDisplayedFilterCount={1} badges={filterBadges} />
      {/** Contenu du module */}
      <div className="flex-grow">{children}</div>
      {/** Footer buttons */}
      {(footerButtons || displaySettings) && (
        <div className="mt-auto flex items-center justify-between">
          {displaySettings && (
            <ButtonGroup
              activeButtonId={displaySettings.display}
              variant="neutral"
              size="xs"
              buttons={getDisplayButtons({
                onClick: (display) => displaySettings.setDisplay(display),
              })}
            />
          )}
          {footerButtons && (
            <div className="ml-auto flex items-center gap-4">
              {footerButtons}
            </div>
          )}
        </div>
      )}
      {renderEditModalDeleteAlert}
    </ModuleContainer>
  );
};

export default Module;

const ModuleContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={classNames(
      'col-span-full min-h-[21rem] flex flex-col gap-4 p-8 bg-white border border-primary-4 rounded-xl',
      className
    )}
  >
    {children}
  </div>
);
