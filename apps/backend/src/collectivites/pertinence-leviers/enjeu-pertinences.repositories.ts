import { Injectable } from '@nestjs/common';
import { Enjeu } from '@tet/domain/shared';
import { CollectiviteLevierGesPertinenceRepository } from './collectivite-levier-ges-pertinence.repository';
import { type PertinenceLeviersRepository } from './pertinence-leviers.repository';

@Injectable()
export class EnjeuPertinencesRepositories {
  constructor(
    private readonly collectiviteLevierGesPertinenceRepository: CollectiviteLevierGesPertinenceRepository
  ) {}

  private readonly pertinencesByEnjeu: Record<
    Enjeu,
    PertinenceLeviersRepository
  > = {
    ges: this.collectiviteLevierGesPertinenceRepository,
  };

  pertinencesOf(enjeu: Enjeu): PertinenceLeviersRepository {
    return this.pertinencesByEnjeu[enjeu];
  }
}
