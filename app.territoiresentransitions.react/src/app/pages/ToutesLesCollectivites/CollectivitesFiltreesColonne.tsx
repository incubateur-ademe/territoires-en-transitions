import {CollectiviteCarte} from 'app/pages/ToutesLesCollectivites/CollectiviteCarte';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';

const CollectivitesFiltrees = (props: {
  collectivites: CollectiviteCarteRead[];
}) => {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {props.collectivites.map(collectivite => (
        <CollectiviteCarte
          collectivite={collectivite}
          key={collectivite.collectivite_id}
        />
      ))}
    </div>
  );
};

const DesactiverLesFiltres = (props: {onClick: () => void}) => (
  <button className="max-h-1 text-sm" onClick={props.onClick}>
    <div className="border-b-2 text-bf500 border-bf500">
      <span
        style={{fontSize: '.7rem'}}
        className="fr-fi-close-circle-fill mr-1"
      ></span>
      <span className="text-xs">Désactiver tous les filtres</span>
    </div>
  </button>
);

const AucuneCollectivite = (props: {desactiverLesFiltres: () => void}) => (
  <div style={{color: '#6A6AF4'}}>
    <p className="font-bold">
      {' '}
      Oups... aucune collectivité ne correspond à votre recherche !{' '}
    </p>
    <p> Modifiez ou désactivez les filtres pour obtenir plus de résultats</p>
    <DesactiverLesFiltres onClick={props.desactiverLesFiltres} />
  </div>
);

const NombreResultats = (props: {count: number}) => {
  if (props.count === 0) return null;
  const className = 'text-gray-500';
  if (props.count === 1)
    return (
      <p className={className}>Une collectivité correspond à votre recherche</p>
    );
  return (
    <p className={className}>
      {props.count > 99 ? 'Plus de 99 ' : props.count} collectivités
      correspondent à votre recherche
    </p>
  );
};

function active(filtres: TCollectivitesFilters): boolean {
  const notEmpty = (l: any[]) => l.length > 0;
  return (
    notEmpty(filtres.regions) ||
    notEmpty(filtres.departments) ||
    notEmpty(filtres.tauxDeRemplissage) ||
    notEmpty(filtres.niveauDeLabellisation) ||
    notEmpty(filtres.population) ||
    notEmpty(filtres.realiseCourant) ||
    notEmpty(filtres.types)
  );
}

export const CollectivitesFiltreesColonne = (props: {
  collectivites: CollectiviteCarteRead[];
  desactiverLesFiltres: () => void;
  children: React.ReactNode;
  filters: TCollectivitesFilters;
}) => {
  const count = props.collectivites.length;
  return (
    <>
      <div className="flex flex-row-reverse justify-between mb-4">
        {props.children}
        <div>
          <NombreResultats count={count} />
          {active(props.filters) ? (
            <DesactiverLesFiltres onClick={props.desactiverLesFiltres} />
          ) : null}
        </div>
      </div>
      {props.collectivites.length === 0 ? (
        <AucuneCollectivite desactiverLesFiltres={props.desactiverLesFiltres} />
      ) : (
        <CollectivitesFiltrees collectivites={props.collectivites} />
      )}
    </>
  );
};
