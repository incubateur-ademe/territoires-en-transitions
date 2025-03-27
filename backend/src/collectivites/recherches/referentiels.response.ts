import { RecherchesContact } from '@/backend/collectivites/recherches/contacts.response';

export type RecherchesReferentiel = {
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteType: string;
  etoilesCae: number;
  scoreFaitCae: number;
  scoreProgrammeCae: number;
  etoilesEci: number;
  scoreFaitEci: number;
  scoreProgrammeEci: number;
  contacts: RecherchesContact[];
};
