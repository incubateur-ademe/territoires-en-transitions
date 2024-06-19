/**
 * Affiche les informations administratives d'une collectivité
 */

import {TCarteIdentite} from './useCarteIdentite';

export type TCarteIdentiteProps = {
  identite: TCarteIdentite;
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
        <p className="text-base mb-6">
          <span className="font-bold">Nom</span>
          <br />
          {nom}
        </p>
        <p className="text-base mb-6">
          <span className="font-bold">Type de collectivité</span>
          <br />
          <span className="capitalize">{type_collectivite}</span>
        </p>
        <p className="text-base mb-6">
          <span className="font-bold">Code SIREN ou INSEE</span>
          <br />
          {code_siren_insee}
        </p>
        <p className="text-base mb-6">
          <span className="font-bold">Région</span>
          <br />
          {region_name}
        </p>
        <p className="text-base mb-6">
          <span className="font-bold">Population ({population_source})</span>
          <br />
          {population_totale?.toLocaleString()} habitants
        </p>
        <p className="text-base mb-6">
          <span className="font-bold">Département</span>
          <br />
          {departement_name}
        </p>
      </div>
    </>
  );
};
