import { Result } from '@tet/backend/utils/result.type';
import { CategorieAction, Levier, LevierSecteur } from '@tet/domain/shared';
import { FicheVoletsError } from './fiche-volets.errors';

export type Volet = {
  levier: Levier;
  secteur: LevierSecteur;
  categorie: CategorieAction;
};

export type FicheVolets = {
  ficheId: number;
  volets: Volet[];
};

export abstract class FicheVoletsRepository {
  abstract saveVolets(
    collectiviteId: number,
    fiches: FicheVolets[]
  ): Promise<Result<void, FicheVoletsError>>;
}
