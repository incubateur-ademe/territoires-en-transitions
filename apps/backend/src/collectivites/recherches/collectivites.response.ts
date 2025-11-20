import { RecherchesContact } from '@tet/backend/collectivites/recherches/contacts.response';

export type RecherchesCollectivite = {
  collectiviteId: number;
  collectiviteNom: string;
  nbIndicateurs: number;
  nbPlans: number;
  etoilesEci: number;
  etoilesCae: number;
  contacts: RecherchesContact[];
};
