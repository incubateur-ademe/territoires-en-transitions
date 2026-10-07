import { Injectable } from '@nestjs/common';
import { Enjeu } from '@tet/domain/shared';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { MobilisationRepository } from './mobilisation.repository';
import { VoletRepository } from './volet.repository';

@Injectable()
export class EnjeuRepositories {
  constructor(
    private readonly ficheActionVoletGesRepository: FicheActionVoletGesRepository,
    private readonly collectiviteVoletGesRepository: CollectiviteVoletGesRepository
  ) {}

  private readonly voletsByEnjeu: Record<Enjeu, VoletRepository> = {
    ges: this.ficheActionVoletGesRepository,
  };

  private readonly mobilisationsByEnjeu: Record<Enjeu, MobilisationRepository> =
    {
      ges: this.collectiviteVoletGesRepository,
    };

  voletsOf(enjeu: Enjeu): VoletRepository {
    return this.voletsByEnjeu[enjeu];
  }

  mobilisationOf(enjeu: Enjeu): MobilisationRepository {
    return this.mobilisationsByEnjeu[enjeu];
  }
}
