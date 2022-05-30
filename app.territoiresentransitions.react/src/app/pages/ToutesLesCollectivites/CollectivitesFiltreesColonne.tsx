import {CollectiviteCarte} from 'app/pages/ToutesLesCollectivites/CollectiviteCarte';

import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';

const CollectivitesFiltrees = (props: {
  collectivites: CollectiviteCarteRead[];
}) => {
  return (
    <div className="flex flex-wrap justify-start">
      {props.collectivites.map(collectivite => (
        <CollectiviteCarte collectivite={collectivite} />
      ))}
    </div>
  );
};

const AucuneCollectivite = (props: {desactiverLesFiltres: () => void}) => (
  <div style={{color: '#6A6AF4'}}>
    <p className="font-bold">
      {' '}
      Oups... aucune collectivité ne correspond à votre recherche !{' '}
    </p>
    <p> Modifiez ou désactivez les filtres pour obtenir plus de résultats</p>
    <button className="max-h-1 text-sm" onClick={props.desactiverLesFiltres}>
      <div className="border-b-2 text-bf500 border-bf500">
        <span
          style={{fontSize: '.7rem'}}
          className="fr-fi-close-circle-fill mr-1"
        ></span>
        <span className="text-xs">Désactiver tous les filtres</span>
      </div>
    </button>
  </div>
);

export const CollectivitesFiltreesColonne = (props: {
  collectivites: CollectiviteCarteRead[];
  desactiverLesFiltres: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-5xl">
      {' '}
      <div className="flex justify-between mb-8 pr-20">
        <p className="text-gray-500 ml-3">
          {props.collectivites.length} collectivités correspondent à votre
          recherche
        </p>
        {props.children}
      </div>
      {props.collectivites.length === 0 ? (
        <AucuneCollectivite desactiverLesFiltres={props.desactiverLesFiltres} />
      ) : (
        <CollectivitesFiltrees collectivites={props.collectivites} />
      )}
    </div>
  );
};
