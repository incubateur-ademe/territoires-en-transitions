import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { CategorieAction, Levier, LevierSecteur } from '@tet/domain/shared';
import { FicheLeviersError } from './fiche-leviers.errors';

export type LevierCategorie = {
  levier: Levier;
  secteur: LevierSecteur;
  categorie: CategorieAction;
};

export type FicheLeviers = {
  ficheId: number;
  leviers: LevierCategorie[];
};

export abstract class FicheLeviersRepository {
  abstract saveLeviers(args: {
    collectiviteId: number;
    fiches: FicheLeviers[];
    tx?: Transaction;
  }): Promise<Result<void, FicheLeviersError>>;
}
