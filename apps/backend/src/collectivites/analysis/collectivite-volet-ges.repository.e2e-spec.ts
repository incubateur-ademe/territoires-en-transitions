import { describe, it } from 'vitest';

describe('MobilisationRepository contract', () => {
  it.todo(
    'listCollectivitesWithMobilisation renvoie toutes les CT qui ont un engagement'
  );
  it.todo(
    'listCollectivitesWithMobilisation ne renvoie pas une CT sans engagement'
  );
  it.todo(
    "getMobilisationState renvoie la date de calcul de l'engagement de la CT et toutes les fiches qu'il cite"
  );
  it.todo(
    'getMobilisationState renvoie never_calculated pour une CT sans engagement'
  );
});
