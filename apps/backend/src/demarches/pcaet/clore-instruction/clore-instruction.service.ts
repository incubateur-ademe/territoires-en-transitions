import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  evaluateTransitions,
  type DemarchePcaet,
  type DemarchePcaetTransition,
} from '@tet/domain/demarches';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import { DemarchePcaetTransitionErrorEnum } from '../shared/demarche-pcaet-transition.errors';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { CloreInstructionError } from './clore-instruction.errors';
import { CloreInstructionRepository } from './clore-instruction.repository';

/** Ce qu'une passe de clôture a produit sur un lot de dossiers. */
export type CloreInstructionsResult = {
  examinees: number;
  closes: number;
  echecs: number;
};

@Injectable()
export class CloreInstructionService {
  private readonly logger = new Logger(CloreInstructionService.name);

  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly repository: CloreInstructionRepository
  ) {}

  /**
   * Fait basculer un dossier en instruit si l'une des deux conditions est
   * réunie, et dit laquelle : les avis attendus sont tous rendus, ou le délai
   * légal est échu. Les avis passent d'abord — quand les deux sont vraies, c'est
   * la remise des avis qui a clos l'instruction, pas l'expiration du délai.
   *
   * Rend `null` quand aucune ne l'est : appeler cette méthode n'est jamais une
   * erreur, ce qui la rend idempotente et sans condition à dupliquer chez les
   * appelants.
   */
  async clore(
    input: DemarchePcaetTransitionInput,
    { tx }: { tx?: Transaction } = {}
  ): Promise<Result<DemarchePcaet | null, CloreInstructionError>> {
    const demarche = await this.refRepository.findRef(input, undefined, tx);
    if (!demarche) {
      return failure(DemarchePcaetTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const transition = await this.resoudreTransition(demarche, tx);
    if (!transition) {
      return success(null);
    }

    // Le choix ci-dessus est indicatif : `applyAsSystem` relit et réévalue sous
    // verrou de ligne, donc c'est lui qui tranche pour de bon.
    return this.transitionService.applyAsSystem(input, transition, { tx });
  }

  /**
   * Passe de rattrapage du planificateur, sur les deux chemins.
   *
   * Le délai échu n'a que celui-ci : personne ne le constate autrement. Mais les
   * avis complets en ont besoin aussi — la clôture à la validation du dernier
   * avis ne joue qu'une fois, et un dossier repassé en élaboration, ou dont la
   * bascule a échoué, resterait sinon ouvert indéfiniment.
   *
   * Chaque dossier a sa propre transaction : un échec isolé ne doit pas
   * emporter le lot.
   */
  async cloreInstructions(): Promise<
    Result<CloreInstructionsResult, CloreInstructionError>
  > {
    const echues = await this.repository.listInstructionsAClore(new Date());
    let closes = 0;
    let echecs = 0;

    for (const cible of echues) {
      const result = await this.clore(cible);
      if (!result.success) {
        echecs += 1;
        this.logger.error(
          `Clôture d'instruction en échec sur la démarche PCAET ${cible.demarcheId} : ${result.error}`
        );
        continue;
      }
      if (result.data) {
        closes += 1;
      }
    }

    this.logger.log(
      `Clôture des instructions : ${closes} close(s) sur ${echues.length} examinée(s), ${echecs} en échec`
    );

    return success({ examinees: echues.length, closes, echecs });
  }

  /**
   * Laquelle des deux transitions système est armée, d'après les guards évalués
   * sans acteur.
   */
  private async resoudreTransition(
    demarche: Parameters<DemarchePcaetGuardsService['loadContext']>[0],
    tx?: Transaction
  ): Promise<DemarchePcaetTransition | null> {
    const context = await this.guardsService.loadContext(demarche, tx);
    const transitions = evaluateTransitions(
      demarche.status,
      this.guardsService.computeGuardResults(context, null)
    );

    if (transitions[DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS].enabled) {
      return DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS;
    }
    if (transitions[DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU].enabled) {
      return DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU;
    }
    return null;
  }
}
