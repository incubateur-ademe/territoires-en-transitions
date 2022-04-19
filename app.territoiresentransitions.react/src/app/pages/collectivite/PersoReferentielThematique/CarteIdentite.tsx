/**
 * Affiche les informations administratives d'une collectivité
 */

import {CarteIdentiteRead} from 'generated/dataLayer/carte_identite_read';

export type TCarteIdentiteProps = {
  identite: CarteIdentiteRead;
};

export const CarteIdentite = (props: TCarteIdentiteProps) => {
  const {identite} = props;
  const {
    code_siren_insee,
    departement_name,
    nom,
    population_source,
    population_totale,
    region_name,
    type_collectivite,
  } = identite;

  return (
    <>
      <h3>Informations administratives officielles</h3>
      <div className="grid grid-cols-2">
        <p className="fr-text--md">
          <span className="fr-text--bold">Nom</span>
          <br />
          {nom}
        </p>
        <p className="fr-text--md">
          <span className="fr-text--bold">Type de collectivité</span>
          <br />
          <span className="capitalize">{type_collectivite}</span>
        </p>
        <p className="fr-text--md">
          <span className="fr-text--bold">Code SIREN ou INSEE</span>
          <br />
          {code_siren_insee}
        </p>
        <p className="fr-text--md">
          <span className="fr-text--bold">Région</span>
          <br />
          {region_name}
        </p>
        <p className="fr-text--md">
          <span className="fr-text--bold">
            Population ({population_source})
          </span>
          <br />
          {population_totale?.toLocaleString()} habitants
        </p>
        <p className="fr-text--md">
          <span className="fr-text--bold">Département</span>
          <br />
          {departement_name}
        </p>
      </div>
    </>
  );
};
