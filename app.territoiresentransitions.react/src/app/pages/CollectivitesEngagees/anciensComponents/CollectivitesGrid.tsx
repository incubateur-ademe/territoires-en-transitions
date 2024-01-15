import {CollectiviteCarte} from 'app/pages/CollectivitesEngagees/anciensComponents/CollectiviteCarte';
import {TCollectiviteCarte} from '../types';
import noResultIllustration from 'app/static/img/no-results-astronaut-bro.svg';
import {Tfilters} from 'app/pages/CollectivitesEngagees/data/filters';

const AucuneCollectivite = () => (
  <div
    className="flex flex-col gap-4 mt-10 md:mt-16"
    style={{color: '#6A6AF4'}}
  >
    <div style={{fontSize: '22px', fontWeight: 'bold'}}>
      {' '}
      Oups... aucune collectivité ne correspond à votre recherche !{' '}
    </div>
    <div style={{fontSize: '20px'}}>
      {' '}
      Modifiez ou désactivez les filtres pour obtenir plus de résultats
    </div>
    <img
      alt=""
      style={{width: 400, alignSelf: 'center'}}
      src={noResultIllustration}
    />
  </div>
);

export const CollectivitesGrid = (props: {
  isLoading?: boolean;
  collectivites: TCollectiviteCarte[];
  collectivitesCount: number;
  filters: Tfilters;
  isCardClickable: boolean;
}) => {
  if (props.isLoading) {
    return (
      <div className="text-center text-gray-500">Chargement en cours...</div>
    );
  }

  return (
    <>
      {props.collectivites.length === 0 ? (
        <AucuneCollectivite />
      ) : (
        <div className="grid xl:grid-cols-2 gap-4">
          {props.collectivites.map(collectivite => (
            <CollectiviteCarte
              key={collectivite.collectivite_id}
              collectivite={collectivite}
              isCardClickable={props.isCardClickable}
            />
          ))}
        </div>
      )}
    </>
  );
};
