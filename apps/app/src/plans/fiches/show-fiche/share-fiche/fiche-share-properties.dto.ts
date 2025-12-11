import { FicheWithRelations } from '@tet/domain/plans';

export type FicheShareProperties = Pick<
  FicheWithRelations,
  'id' | 'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
>;
