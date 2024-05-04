import React from 'react';

type Props = {
  title: string;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir le module ActionsDontJeSuisPilote pour un exemple) */
  children: React.ReactNode;
};

/** Composant générique d'un module du tableau de bord plans d'action */
const Module = ({title, children}: Props) => {
  /**
   * TODO
   * - [ ] Afficher un état vide
   * - [ ] Afficher les filtres sélectionnés dans une liste de badges
   */

  /**
   * À ne pas faire
   * - le bouton pour changer les filtres (on fera cela dans un second temps)
   */

  return (
    <div className="p-8 bg-primary-0 border border-primary-4 rounded-xl">
      <h6>{title}</h6>
      {/** Filters */}
      {children}
    </div>
  );
};

export default Module;
