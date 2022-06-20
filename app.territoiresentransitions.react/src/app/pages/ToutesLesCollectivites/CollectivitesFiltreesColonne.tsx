import {CollectiviteCarte} from 'app/pages/ToutesLesCollectivites/CollectiviteCarte';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {allCollectivitesPath} from 'app/paths';
const noResultIllustration = require('app/static/img/no-results-astronaut-bro.svg');

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

const DesactiverLesFiltres = (props: {onClick: () => void}) => {
  // fixme. hard navigate to reset filters
  return (
    <div className="flex">
      <a className="text-sm" href={allCollectivitesPath}>
        <div className="text-bf500 border-bf500">
          <span
            style={{fontSize: '.7rem'}}
            className="fr-fi-close-circle-fill mr-1"
          ></span>
          <span className="text-xs">Désactiver tous les filtres</span>
        </div>
      </a>
    </div>
  );
};

const AucuneCollectivite = (props: {desactiverLesFiltres: () => void}) => (
  <div className="flex flex-col gap-4" style={{color: '#6A6AF4'}}>
    <div style={{fontSize: '22px', fontWeight: 'bold'}}>
      {' '}
      Oups... aucune collectivité ne correspond à votre recherche !{' '}
    </div>
    <div style={{fontSize: '20px'}}>
      {' '}
      Modifiez ou désactivez les filtres pour obtenir plus de résultats
    </div>
    <DesactiverLesFiltres onClick={props.desactiverLesFiltres} />
    <img
      alt=""
      style={{width: 400, alignSelf: 'center'}}
      src={noResultIllustration.default}
    />
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
      {props.count} collectivités correspondent à votre recherche
    </p>
  );
};

const someFiltersAreActive = (filtres: TCollectivitesFilters): boolean => {
  const notEmpty = (l: any[]) => l.length > 0;
  return (
    notEmpty(filtres.regions) ||
    notEmpty(filtres.departments) ||
    notEmpty(filtres.tauxDeRemplissage) ||
    notEmpty(filtres.niveauDeLabellisation) ||
    notEmpty(filtres.population) ||
    notEmpty(filtres.realiseCourant) ||
    notEmpty(filtres.types) ||
    notEmpty(filtres.referentiel) ||
    !!filtres.nom
  );
};

export const CollectivitesFiltreesColonne = (props: {
  collectivites: CollectiviteCarteRead[];
  collectivitesCount: number;
  desactiverLesFiltres: () => void;
  children: React.ReactNode;
  filters: TCollectivitesFilters;
}) => {
  return (
    <>
      <div className="flex flex-row-reverse justify-between mb-4">
        {props.children}
        <div>
          <NombreResultats count={props.collectivitesCount} />
          {someFiltersAreActive(props.filters) &&
          props.collectivites.length > 0 ? (
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
