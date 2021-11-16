// TODO : This should be defined in generated

import {Avancement} from 'generated/dataLayer/action_statut_read';
export type FicheActionAvancement = Exclude<Avancement, 'programme'>;

export type Referentiel = 'eci' | 'cae';
export type ReferentielOfIndicateur = 'eci' | 'cae' | 'crte';
