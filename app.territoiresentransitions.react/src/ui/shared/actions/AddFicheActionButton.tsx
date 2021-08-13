import { Link } from "react-router-dom";

export const AddFicheActionButton = () => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
    to="./fiches/creation/"
  >
    Ajouter une fiche action
  </Link>
);
