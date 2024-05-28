import {FiltreValues} from '@tet/api/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {Badge, Button} from '@tet/ui';
import classNames from 'classnames';
import React, {useState} from 'react';
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
  /** Fonction d'affichage de la modale avec les filtres du modules,
   * à afficher au clique des boutons d'édition.
   * Récupère le state d'ouverture en argument */
  editModal: (modalState: ModalState) => React.ReactNode;
  /** État de loading générique */
  isLoading: boolean;
  /** État vide générique */
  isEmpty: boolean;
  /** Affiche les filtres sélectionnés dans une liste de badges */
  selectedFilters: FiltreValues;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActions pour un exemple) */
  children: React.ReactNode;
  /** Des boutons optionnels dans un fragment qui s'affichent au pied du module */
  footerButtons?: React.ReactNode;
};

/** Composant générique d'un module du tableau de bord plans d'action */
const Module = ({
  title,
  symbole,
  editModal,
  isLoading,
  selectedFilters,
  isEmpty,
  children,
  footerButtons,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <ModuleContainer>
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </ModuleContainer>
    );
  }

  if (isEmpty) {
    return (
      <ModuleContainer className="gap-0 items-center text-center !bg-primary-0">
        <div className="mb-4">{symbole}</div>
        <h4 className="mb-2 text-primary-8">{title}</h4>
        <p className="m-0 font-bold text-primary-9">
          Aucun résultat pour ce filtre !
        </p>
        <div className="flex gap-4 my-6">
          {getBadgesOfFiltreValues(selectedFilters)}
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          Modifier le filtre
        </Button>
        {editModal({isOpen: isModalOpen, setIsOpen: setIsModalOpen})}
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer>
      <div className="flex items-start gap-20">
        <div>
          <h6 className="mb-0">{title}</h6>
          <div className="flex gap-4 mt-4">
            {/** Selected filters */}
            {getBadgesOfFiltreValues(selectedFilters)}
          </div>
        </div>
        <>
          {/** Bouton d'édition des filtres du module + modale */}
          <Button
            variant="grey"
            icon="edit-line"
            size="xs"
            className="ml-auto"
            onClick={() => setIsModalOpen(true)}
          />
          {editModal({isOpen: isModalOpen, setIsOpen: setIsModalOpen})}
        </>
      </div>
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
      'min-h-[21rem] flex flex-col gap-6 p-8 bg-white border border-primary-4 rounded-xl',
      className
    )}
  >
    {children}
  </div>
);

function getBadgesOfFiltreValues(filtreValues: FiltreValues) {
  return Object.entries(filtreValues).map(([key, values]) => {
    return values.map((value, index) => {
      return (
        <Badge
          key={index}
          title={'prenom' in value ? `${value.prenom} ${value.nom}` : value.nom}
          state="standard"
        />
      );
    });
  });
}
