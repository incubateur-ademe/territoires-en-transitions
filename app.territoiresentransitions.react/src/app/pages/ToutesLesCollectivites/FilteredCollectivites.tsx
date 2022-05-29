import {CollectiviteCarte} from 'app/pages/ToutesLesCollectivites/CollectiviteCarte';

import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';

export const FilteredCollectivites = (props: {
  collectivites: CollectiviteCarteRead[];
}) => {
  return (
    <>
      {props.collectivites.map(collectivite => (
        <CollectiviteCarte collectivite={collectivite} />
      ))}
    </>
  );
};
