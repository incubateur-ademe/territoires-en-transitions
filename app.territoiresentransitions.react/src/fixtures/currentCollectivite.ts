import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';

const fakeCurrentCollectiviteBase = {
  collectiviteId: 1,
  nom: 'Fake Collectivite',
};

export const fakeCurrentCollectiviteAdmin: CollectiviteNiveauAcces = {
  ...fakeCurrentCollectiviteBase,
  niveauAcces: 'admin',
  isRoleAuditeur: false,
  role: null,
  isReadOnly: false,
  accesRestreint: false,
};

export const fakeCurrentCollectiviteLecture: CollectiviteNiveauAcces = {
  ...fakeCurrentCollectiviteBase,
  niveauAcces: 'lecture',
  isRoleAuditeur: false,
  role: null,
  isReadOnly: true,
  accesRestreint: false,
};
