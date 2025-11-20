import { FicheWithRelations } from '@/domain/plans';

export type FicheShareProperties = Pick<
  FicheWithRelations,
  'id' | 'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
>;
