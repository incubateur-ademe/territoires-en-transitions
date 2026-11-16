import { SecteurReglementaire } from './secteur-reglementaire.enum.schema';

export const SECTEUR_REGLEMENTAIRE_LABELS = {
  residentiel: 'Résidentiel',
  tertiaire: 'Tertiaire',
  transport_routier: 'Transport routier',
  autres_transports: 'Autres transports',
  agriculture: 'Agriculture',
  dechets: 'Déchets',
  industrie_hors_branche_energie: 'Industrie hors branche énergie',
  branche_energie: 'Branche énergie',
  amenagement: 'Aménagement',
  biodiversite: 'Biodiversité',
  eau: 'Eau',
  foret_et_sols: 'Forêt et sols',
  economie: 'Économie',
  sante: 'Santé',
  risques_naturels: 'Risques naturels',
} as const satisfies Record<SecteurReglementaire, string>;
