import {Link} from 'react-router-dom';

export const AddFicheActionButton = () => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
    to="./fiches/creation/"
  >
    <span className="bg-yellow-200">todo</span> Ajouter une fiche action
  </Link>
);
