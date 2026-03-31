import { Fiche } from '@/app/plans/fiches/data/use-get-fiche';

export type FicheShareProperties = Pick<
  Fiche,
  'id' | 'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
>;
