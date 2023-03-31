import {Database} from 'types/database.types';

export type FinanceurMontant = {
  id?: number;
  montant_ttc?: number;
  financeur_tag: Database['public']['Tables']['financeur_tag']['Insert'];
};
