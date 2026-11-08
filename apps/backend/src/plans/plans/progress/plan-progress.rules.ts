import { Injectable } from '@nestjs/common';
import { Fiche, StatutEnum } from '@tet/domain/plans';
import { mean, round, uniqBy } from 'es-toolkit';

type FicheForProgress = Pick<Fiche, 'id' | 'parentId' | 'statut' | 'jauge'>;

@Injectable()
export class PlanProgressRules {
  computeProgress(fiches: FicheForProgress[]): number {
    const jauges = uniqBy(fiches, (fiche) => fiche.id)
      .filter(
        (fiche) => !fiche.parentId && fiche.statut !== StatutEnum.ABANDONNE
      )
      .map((fiche) => fiche.jauge);

    return jauges.length ? round(mean(jauges), 1) : 0;
  }
}
