// TODO : This should be defined in generated
export type Avancement =
  | ''
  | 'faite'
  | 'programmee'
  | 'pas_faite'
  | 'non_concernee'
  | 'en_cours';

export type FicheActionAvancement = Exclude<
  Avancement,
  'non_concernee' | 'programmee' | ''
>;

export type Referentiel = 'eci' | 'cae';
export type ReferentielOfIndicateur = 'eci' | 'cae' | 'crte';
