import { NIVEAUX } from '../tableau-de-bord/labellisation/LabellisationInfo';
import { GreyStar, RedStar } from '../tableau-de-bord/labellisation/Star';
import { formatEtoile } from './labellisations-admin.utils';

/** Étoiles obtenues en rouge, les suivantes en gris. */
export const Etoiles = ({ etoiles }: { etoiles: string | number }) => (
  <div className="flex" title={formatEtoile(etoiles)}>
    {NIVEAUX.map((niveau) => {
      const Star = Number(etoiles) >= niveau ? RedStar : GreyStar;
      return <Star key={niveau} className="w-5 h-5" />;
    })}
  </div>
);
