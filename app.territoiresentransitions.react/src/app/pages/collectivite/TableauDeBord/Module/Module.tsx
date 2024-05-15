import {Badge, Button} from '@tet/ui';
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
  selectedFilters: string[];
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActions pour un exemple) */
  children: React.ReactNode;
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
      <ModuleContainer>
        <div className="m-auto flex flex-col items-center text-center">
          <div className="mb-4">{symbole}</div>
          <h4 className="mb-2 text-primary-8">{title}</h4>
          <p className="m-0 font-bold text-primary-9">
            Aucun résultat pour ce filtre !
          </p>
          <div className="flex gap-4 my-6">
            {selectedFilters.map(filter => (
              <Badge key={filter} title={filter} state="standard" />
            ))}
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            Modifier le filtre
          </Button>
          {editModal({isOpen: isModalOpen, setIsOpen: setIsModalOpen})}
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer>
      <div className="flex items-start gap-20">
        <h6>{title}</h6>
        <>
          <Button
            variant="outlined"
            icon="settings-2-line"
            size="xs"
            className="ml-auto"
            onClick={() => setIsModalOpen(true)}
          />
          {editModal({isOpen: isModalOpen, setIsOpen: setIsModalOpen})}
        </>
      </div>
      {/** Filters */}
      {children}
    </ModuleContainer>
  );
};

export default Module;

const ModuleContainer = ({children}: {children: React.ReactNode}) => (
  <div className="min-h-[21rem] flex flex-col p-8 bg-primary-0 border border-primary-4 rounded-xl">
    {children}
  </div>
);
