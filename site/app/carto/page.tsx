'use server';

import CarteCollectivites from './CarteCollectivites';

/**
 * Page de test
 */

export default async function Page() {
  return (
    <div>
      <h2 className="mt-20">Labellisées</h2>
      <CarteCollectivites filtre="labellisees" />

      <h2 className="mt-20">Labellisées ECI</h2>
      <CarteCollectivites filtre="labellisees_eci" />

      <h2 className="mt-20">Labellisées CAE</h2>
      <CarteCollectivites filtre="labellisees_cae" />

      <h2 className="mt-20">COT</h2>
      <CarteCollectivites filtre="cot" />
    </div>
  );
}
