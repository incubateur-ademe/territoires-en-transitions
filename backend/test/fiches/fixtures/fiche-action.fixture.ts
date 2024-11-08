import {
  CreateFicheActionType,
  FicheActionCiblesEnumType,
  ficheActionPiliersEciEnumType,
  ficheActionResultatsAttendusEnumType,
  FicheActionStatutsEnumType,
} from '../../../src/fiches/models/fiche-action.table';

export const ficheActionFixture: CreateFicheActionType = {
  id: 9999,
  titre: 'Test Fiche Action',
  description: 'patati',
  piliersEci: [ficheActionPiliersEciEnumType.APPROVISIONNEMENT_DURABLE],
  objectifs: 'Diminution des émissions de carbone',
  resultatsAttendus: [
    ficheActionResultatsAttendusEnumType.ALLONGEMENT_DUREE_USAGE,
  ],
  cibles: [
    FicheActionCiblesEnumType.GRAND_PUBLIC_ET_ASSOCIATIONS,
    FicheActionCiblesEnumType.AGENTS,
  ],
  ressources: 'Service digitaux',
  financements: '100 000€',
  budgetPrevisionnel: '35000',
  statut: FicheActionStatutsEnumType.EN_PAUSE,
  niveauPriorite: 'Moyen',
  dateDebut: null,
  dateFinProvisoire: null,
  ameliorationContinue: false,
  calendrier: 'Calendrier à préciser',
  notesComplementaires: '',
  majTermine: true,
  collectiviteId: 1,
  createdAt: '2024-11-08 09:09:16.731248+00',
  modifiedBy: null,
  restreint: false,
};
