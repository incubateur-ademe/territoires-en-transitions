import { RecherchesContact } from '@tet/backend/collectivites/recherches/contacts.response';

export type RecherchesPlan = {
  collectiviteId: number;
  collectiviteNom: string;
  planId: number;
  planNom: string;
  planType?: string;
  contacts: RecherchesContact[];
};
