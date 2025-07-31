import { FicheWithRelations } from '@/domain/plans/fiches';

export type FicheShareProperties = Pick<
  FicheWithRelations,
  'id' | 'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
>;
