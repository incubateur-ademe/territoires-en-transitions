import type {Avancement, Referentiel} from 'types';

// Define all labels from app
export const referentielToName: Record<Referentiel, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
};

export const avancementLabels: Omit<Record<Avancement, string>, ''> = {
  non_concernee: 'Non concernée',
  pas_faite: 'Pas faite',
  programmee: 'Prévue',
  en_cours: 'En cours',
  faite: 'Faite',
};
