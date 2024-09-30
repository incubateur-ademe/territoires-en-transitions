import { Filtre } from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { Button, useEventTracker } from '@tet/ui';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/Module/ModuleFiltreBadges';
import classNames from 'classnames';
import { useCollectiviteId } from 'core-logic/hooks/params';
import React, { useState } from 'react';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

type ModalState = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

type Props = {
  /** Titre du module */
  title: string;
  /** Symbole du module (picto svg) */
  symbole?: React.ReactNode;
  /** ID de tracking */
  trackingId: 'indicateurs' | 'actions_pilotes' | 'actions_modifiees';
  /** Fonction d'affichage de la modale avec les filtres du modules,
   * à afficher au clique des boutons d'édition.
   * Récupère le state d'ouverture en argument */
  editModal: (modalState: ModalState) => React.ReactNode;
  /** État de loading générique */
  isLoading: boolean;
  /** État vide générique */
  isEmpty: boolean;
  /** Filtre du module */
  filtre?: Filtre;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActions pour un exemple) */
  children: React.ReactNode;
  /** Classe donnée au container afin d'appliquer par exemple
   *  le nombre de colonne à remplir dans la grille */
  className?: string;
  /** Des boutons optionnels dans un fragment qui s'affichent au pied du module */
  footerButtons?: React.ReactNode;
};

/** Composant générique d'un module du tableau de bord plans d'action */
const Module = ({
  title,
  filtre,
  symbole,
  trackingId,
  editModal,
  isLoading,
  isEmpty,
  children,
  className,
  footerButtons,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const collectivite_id = useCollectiviteId()!;

  const trackEvent = useEventTracker('app/tdb/personnel');

  if (isLoading) {
    return (
      <ModuleContainer className={className}>
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </ModuleContainer>
    );
  }

  if (isEmpty) {
    return (
      <ModuleContainer
        className={classNames(
          '!gap-0 items-center text-center !bg-primary-0',
          className
        )}
      >
        <div className="mb-4">{symbole}</div>
        <h4 className="mb-2 text-primary-8">{title}</h4>
        <p className="m-0 font-bold text-primary-9">
          Aucun résultat pour ce filtre !
        </p>
        <ModuleFiltreBadges
          className="my-6 justify-center"
          filtre={filtre ?? {}}
        />
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          Modifier le filtre
        </Button>
        {editModal({ isOpen: isModalOpen, setIsOpen: setIsModalOpen })}
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer className="!border-grey-3">
      <div className="flex items-start gap-20">
        <h6 className="mb-0">{title}</h6>
        <>
          {/** Bouton d'édition des filtres du module + modale */}
          <Button
            variant="grey"
            icon="edit-line"
            size="xs"
            className="ml-auto"
            onClick={() => {
              trackEvent(`tdb_modifier_filtres_${trackingId}`, {
                collectivite_id,
              });
              setIsModalOpen(true);
            }}
          />
          {isModalOpen &&
            editModal({ isOpen: isModalOpen, setIsOpen: setIsModalOpen })}
        </>
      </div>
      {/** Filtres du module */}
      <ModuleFiltreBadges filtre={filtre ?? {}} />
      {/** Contenu du module */}
      <div className="flex-grow">{children}</div>
      {/** Footer buttons */}
      {footerButtons && (
        <div className="mt-auto ml-auto flex items-center gap-4">
          {footerButtons}
        </div>
      )}
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
      'min-h-[21rem] flex flex-col gap-4 p-8 bg-white border border-primary-4 rounded-xl',
      className
    )}
  >
    {children}
  </div>
);
