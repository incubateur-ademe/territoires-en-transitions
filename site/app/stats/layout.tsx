import {fr} from '@codegouvfr/react-dsfr';
import RegionAndDeptFilters from './RegionAndDeptFilters';

const StatsLayout = ({children}: {children: JSX.Element}) => {
  return (
    <div className="fr-container-fluid">
      <section className={`fr-container ${fr.cx('fr-mb-4w')}`}>
        <h1 className={fr.cx('fr-mt-4w')}>Statistiques</h1>
        <RegionAndDeptFilters />
      </section>
      {children}
    </div>
  );
};

export default StatsLayout;
