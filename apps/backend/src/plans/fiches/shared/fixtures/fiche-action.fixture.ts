import { piliersEciEnumType, StatutEnum } from '../../domain/fiche.types';
import { FicheCreate } from '../models/fiche-action.table';

export const ficheActionFixture: FicheCreate = {
  id: 9999,
  titre: 'Test Fiche Action',
  description: 'patati',
  piliersEci: [piliersEciEnumType.APPROVISIONNEMENT_DURABLE],
  objectifs: 'Diminution des émissions de carbone',
  cibles: ['Agents', 'Grand public'],
  ressources: 'Service digitaux',
  financements: '100 000€',
  budgetPrevisionnel: '35000',
  statut: StatutEnum.EN_PAUSE,
  priorite: 'Moyen',
  dateDebut: null,
  dateFin: null,
  ameliorationContinue: false,
  calendrier: 'Calendrier à préciser',
  notesComplementaires: '',
  majTermine: true,
  collectiviteId: 1,
  createdAt: '2024-11-08T09:09:16Z',
  modifiedBy: null,
  restreint: false,
  tempsDeMiseEnOeuvre: 1,
  participationCitoyenne: 'Participation',
  participationCitoyenneType: 'concertation',
};
