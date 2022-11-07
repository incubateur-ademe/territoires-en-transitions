import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

const fakeCurrentCollectiviteBase = {
  collectivite_id: 1,
  nom: 'Fake Collectivite',
};

export const fakeCurrentCollectiviteAdmin: CurrentCollectivite = {
  ...fakeCurrentCollectiviteBase,
  niveau_acces: 'admin',
  isAdmin: true,
  is_auditeur: false,
  readonly: false,
};

export const fakeCurrentCollectiviteLecture: CurrentCollectivite = {
  ...fakeCurrentCollectiviteBase,
  niveau_acces: 'lecture',
  isAdmin: false,
  is_auditeur: false,
  readonly: true,
};
