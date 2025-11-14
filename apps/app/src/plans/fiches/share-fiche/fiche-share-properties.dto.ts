import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';

export type FicheShareProperties = Pick<
  Fiche,
  'id' | 'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
>;
