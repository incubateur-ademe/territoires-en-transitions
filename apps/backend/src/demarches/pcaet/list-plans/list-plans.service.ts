import { Injectable } from '@nestjs/common';
import { DemarchePcaetLectureService } from '../shared/demarche-pcaet-lecture.service';
import { DemarchePlansContenuRepository } from '@tet/backend/demarches/shared/demarche-plans-contenu.repository';
import type { DemarchePlanContenu } from '@tet/backend/demarches/shared/models/demarche-plan-contenu.dto';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import { ListPlansError, ListPlansErrorEnum } from './list-plans.errors';
import { ListPlansInput } from './list-plans.input';

/**
 * Le programme d'actions de la démarche, tel que la collectivité déposante le
 * relit pendant la finalisation.
 *
 * Même contenu que celui remis à l'instructeur, par le même repository : c'est
 * un rappel du dossier transmis, il n'aurait pas de sens qu'il en diffère. La
 * collectivité a bien accès à ses plans par les routes `plans`, mais celles-ci
 * rendent l'arbre complet et modifiable ; ici on ne veut que la vue aplatie du
 * périmètre rattaché à la démarche.
 */
@Injectable()
export class ListPlansService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly plansContenuRepository: DemarchePlansContenuRepository
  ) {}

  async listPlans(
    { collectiviteId, demarcheId }: ListPlansInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePlanContenu[], ListPlansError>> {
    // Qui édite la démarche, ou un membre d'un EPCI qu'elle couvre.
    const lectureResult = await this.lectureService.canRead(
      { collectiviteId: collectiviteId, demarcheId: demarcheId },
      { user, tx }
    );
    if (!lectureResult.success) {
      return failure(ListPlansErrorEnum.UNAUTHORIZED);
    }

    const db = tx ?? this.databaseService.db;

    // Le couple (démarche, collectivité) est vérifié en base plutôt que déduit
    // de l'entrée : sans quoi l'identifiant d'une démarche d'une autre
    // collectivité passerait la barrière de permission ci-dessus.
    const [demarche] = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      )
      .limit(1);
    if (!demarche) {
      return failure(ListPlansErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    return success(
      await this.plansContenuRepository.listPlansAvecContenu(
        {
          demarcheId: demarche.id,
          collectiviteId,
          // Un membre couvert n'a aucun rôle sur le porteur : ses fiches
          // restreintes lui restent cachées. Qui édite garde ce droit.
          hideFichesRestreintes: lectureResult.data.lectureSeule,
        },
        tx
      )
    );
  }
}
