import {Card} from '@tet/ui';
import {SecteurTrajectoire} from 'app/pages/collectivite/Trajectoire/constants';

/** Affiche l'encadré "Méthodologie" (lorsqu'un secteur est sélectionné) */
export const Methodologie = ({secteur}: {secteur: SecteurTrajectoire}) => {
  return (
    <Card>
      <h5 className="mb-0">Méthodologie</h5>
      {'snbc2' in secteur && (
        <>
          <p className="text-primary-8 font-bold mb-0">SNBC 2</p>
          <p className="mb-0 font-normal">
            {secteur.snbc2.map(s => (
              <>
                {s}
                <br />
              </>
            ))}
          </p>
        </>
      )}
      {'pivots' in secteur && (
        <>
          <p className="text-primary-8 font-bold mb-0">
            Méthode de territorialisation
          </p>
          <p className="mb-0 font-normal">
            {secteur.pivots.map(s => (
              <>
                {s}
                <br />
              </>
            ))}
          </p>
        </>
      )}
    </Card>
  );
};
