import {RegionFiltre} from 'app/pages/ToutesLesCollectivites/ListeFiltres';
import {FilteredCollectivites} from 'app/pages/ToutesLesCollectivites/FilteredCollectivites';
import {
  useFilteredCollectivites,
  useRegionCodesFilter,
} from 'app/pages/ToutesLesCollectivites/hooks';

const ToutesLesCollectivites = () => {
  // top state
  const {codes, updateCodes} = useRegionCodesFilter();
  const {collectivites, isLoading} = useFilteredCollectivites({
    regionCodes: codes,
  });

  return (
    <>
      <h1>Toutes les collectivités</h1>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <RegionFiltre codes={codes} updateCodes={updateCodes} />
        </div>
        <div className="flex flex-col">
          <FilteredCollectivites collectivites={collectivites} />
        </div>
      </div>
    </>
  );
};

export default ToutesLesCollectivites;
