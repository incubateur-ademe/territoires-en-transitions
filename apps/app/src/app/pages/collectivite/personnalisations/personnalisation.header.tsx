import { PersonnalisationFilterBadges } from './filters/personnalisation-filter-badges';
import { PersonnalisationFiltersMenu } from './filters/personnalisation-filters.menu';

export function PersonnalisationHeader() {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="font-normal text-primary-9">
          Les mesures et sous mesures proposées dans les référentiels
          Écologiques dépendent des compétences et caractéristiques de chaque
          collectivité.
        </div>
        <PersonnalisationFiltersMenu />
      </div>
      <hr className="mt-4 mb-2" />
      <PersonnalisationFilterBadges />
    </>
  );
}
