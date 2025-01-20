import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';

const fakeCurrentCollectiviteBase = {
  collectiviteId: 1,
  nom: 'Fake Collectivite',
};

export const fakeCurrentCollectiviteAdmin: CurrentCollectivite = {
  ...fakeCurrentCollectiviteBase,
  niveauAcces: 'admin',
  isRoleAuditeur: false,
  role: null,
  isReadOnly: false,
  accesRestreint: false,
};

export const fakeCurrentCollectiviteLecture: CurrentCollectivite = {
  ...fakeCurrentCollectiviteBase,
  niveauAcces: 'lecture',
  isRoleAuditeur: false,
  role: null,
  isReadOnly: true,
  accesRestreint: false,
};
