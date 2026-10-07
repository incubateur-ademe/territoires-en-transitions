import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ActionDefinition,
  ActionDefinitionEssential,
  ActionTreeNode,
  ActionType,
  ReferentielId,
  referentielIdEnumSchema,
} from '@tet/domain/referentiels';
import { isNil } from 'es-toolkit';
import { CorrelatedActionsFields } from '../correlated-actions/correlated-actions.dto';
import { GetActionOrigineDtoSchema } from '../correlated-actions/get-action-origine.dto';
import { GetActionOrigineTexteDtoSchema } from '../correlated-actions/get-action-origine-texte.dto';
import { GetReferentielDefinitionService } from '../definitions/get-referentiel-definition/get-referentiel-definition.service';
import {
  ActionDefinitionAvecParent,
  GetReferentielRepository,
} from './get-referentiel.repository';

/**
 * Représentation du referentiel sous forme de liste, map ou hierarchie
 */
export interface ReferentielResponse {
  version: string;
  orderedItemTypes: Array<ActionType>;
  itemsTree: ActionTreeNode<
    ActionDefinitionEssential & CorrelatedActionsFields
  >;
}

@Injectable()
export class GetReferentielService {
  private readonly logger = new Logger(GetReferentielService.name);

  constructor(
    private readonly getReferentielRepository: GetReferentielRepository,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService
  ) {}

  async getReferentielTree(
    referentielId: ReferentielId,
    options?: {
      onlyForScoring?: boolean;
      getActionsOrigine?: boolean;
      withPreuves?: boolean;
      getActionsOrigineTexte?: boolean;
    }
  ): Promise<ReferentielResponse> {
    this.logger.log(`Get referentiel ${referentielId}`);

    const referentielDefinition =
      await this.getReferentielDefinitionService.getReferentielDefinition(
        referentielId
      );

    const actionDefinitions =
      await this.getReferentielRepository.getActionDefinitionsWithParent(
        referentielId,
        referentielDefinition.version,
        {
          withSelectColumns: options?.onlyForScoring ? 'essential' : 'all',
          withPreuves: options?.withPreuves,
        }
      );

    this.logger.log(
      `${actionDefinitions.length} actions trouvees pour le referentiel ${referentielId}`
    );

    const actionOrigines = options?.getActionsOrigine
      ? await this.getReferentielRepository.getActionsOrigine(referentielId)
      : null;

    const actionOrigineTextes = options?.getActionsOrigineTexte
      ? await this.getReferentielRepository.getActionsOrigineTexte(
          referentielId
        )
      : null;

    const actionsTree = buildReferentielTree(
      actionDefinitions,
      referentielDefinition.hierarchie,
      actionOrigines,
      actionOrigineTextes
    );

    return {
      itemsTree: actionsTree,
      version: referentielDefinition.version,
      orderedItemTypes: referentielDefinition.hierarchie,
    };
  }
}

export function buildReferentielTree(
  actionDefinitions: ActionDefinitionAvecParent[],
  orderedActionTypes: ActionType[],
  actionOrigines?: GetActionOrigineDtoSchema[] | null,
  actionOrigineTextes?: GetActionOrigineTexteDtoSchema[] | null
) {
  const rootAction = actionDefinitions.find((action) => !action.parentActionId);
  if (!rootAction) {
    throw new NotFoundException(`Referentiel not found`);
  }

  const { parentActionId, ...rootActionSansParent } = rootAction;
  const referentiel = {
    ...rootActionSansParent,
    level: 0,
    actionType: orderedActionTypes[0],
    actionsEnfant: [],
    tags: [],
  };

  attacheActionsEnfant(
    referentiel,
    actionDefinitions,
    orderedActionTypes,
    referentiel.level,
    actionOrigines,
    actionOrigineTextes
  );

  return referentiel;
}

function attacheActionsEnfant(
  referentiel: ActionTreeNode<
    Partial<ActionDefinition> &
      ActionDefinitionEssential &
      CorrelatedActionsFields
  >,
  actionDefinitions: ActionDefinitionAvecParent[],
  orderActionTypes: ActionType[],
  currentLevel: number,
  actionOrigines?: GetActionOrigineDtoSchema[] | null,
  actionOrigineTextes?: GetActionOrigineTexteDtoSchema[] | null
): void {
  const actionsEnfant = actionDefinitions.filter(
    (action) => action.parentActionId === referentiel.actionId
  );

  if (!referentiel.tags) {
    referentiel.tags = [];
  }
  // Ajoute la catégorie comme tag
  if (referentiel.categorie) {
    referentiel.tags.push(referentiel.categorie);
  }

  if (actionOrigines) {
    const associatedActionOrigines = actionOrigines.filter(
      (origine) => origine.actionId === referentiel.actionId
    );

    referentiel.actionsOrigine = associatedActionOrigines.map((origine) => ({
      referentielId: referentielIdEnumSchema.parse(origine.origineReferentielId),
      actionId: origine.origineActionId,
      ponderation: origine.ponderation,
      nom: origine.origineActionNom || null,
    }));

    referentiel.referentielsOrigine = [
      ...new Set(
        associatedActionOrigines.map(
          (actionOrigine) => actionOrigine.origineReferentielId
        )
      ).values(),
    ];
  }

  if (actionOrigineTextes) {
    const associatedActionOrigineTextes = actionOrigineTextes.filter(
      (origine) => origine.actionId === referentiel.actionId
    );

    referentiel.actionsOrigineTexte = associatedActionOrigineTextes.map(
      (origine) => ({
        referentielId: referentielIdEnumSchema.parse(
          origine.origineReferentielId
        ),
        actionId: origine.origineActionId,
        nom: origine.origineActionNom || null,
      })
    );
  }

  if (actionsEnfant.length) {
    const levelEnfant = currentLevel + 1;
    if (levelEnfant >= orderActionTypes.length) {
      throw new HttpException(
        `Action level ${levelEnfant} non consistent with referentiel action types: ${orderActionTypes.join(
          ','
        )}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    const actionTypeEnfant = orderActionTypes[levelEnfant];

    const equiPercentage = actionsEnfant.every(
      (action) => !action.pourcentage && isNil(action.points)
    );
    if (equiPercentage) {
      // Enlève les actions réglementaires avec un pourcentage à 0
      const enfantSansPourcentage = actionsEnfant.filter((action) =>
        isNil(action.pourcentage)
      );
      actionsEnfant.forEach((action) => {
        if (isNil(action.pourcentage)) {
          action.pourcentage = 100 / enfantSansPourcentage.length;
        }
      });
    } else {
      //
      const hasPourcentage = actionsEnfant.some((action) => action.pourcentage);
      if (hasPourcentage) {
        const totalPourcentage = actionsEnfant.reduce(
          (acc, action) => acc + (action.pourcentage || 0),
          0
        );
        if (totalPourcentage !== 100) {
          throw new HttpException(
            `Total pourcentage des actions enfant de ${referentiel.actionId} doit être égal à 100`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }
    }

    actionsEnfant.forEach((actionEnfant) => {
      const { parentActionId, ...actionEnfantSansParent } = actionEnfant;
      const actionEnfantDansReferentiel = {
        ...actionEnfantSansParent,
        actionsEnfant: [],
        level: levelEnfant,
        actionType: actionTypeEnfant,
      };
      if (
        isNil(actionEnfantDansReferentiel.points) &&
        !isNil(actionEnfantDansReferentiel.pourcentage) &&
        !isNil(referentiel.points)
      ) {
        actionEnfantDansReferentiel.points =
          (referentiel.points * actionEnfantDansReferentiel.pourcentage) / 100;
      }
      referentiel.actionsEnfant.push(actionEnfantDansReferentiel);

      attacheActionsEnfant(
        actionEnfantDansReferentiel,
        actionDefinitions,
        orderActionTypes,
        levelEnfant,
        actionOrigines,
        actionOrigineTextes
      );
    });

    // Maintenant que la recursion est terminée, on recalcule le score du parent et on met à jour le referentiel origine
    if (referentiel.actionsEnfant.length > 0) {
      if (isNil(referentiel.points)) {
        // Only if not already computed

        referentiel.points = referentiel.actionsEnfant.reduce(
          (acc, action) => acc + (action.points || 0),
          0
        );
      }
      referentiel.actionsEnfant.forEach((action) => {
        if (action.points && referentiel.points) {
          action.pourcentage = (action.points / referentiel.points) * 100;
        }
      });

      // We update the origine referentiels too
      if (actionOrigines) {
        referentiel.referentielsOrigine = [
          ...new Set(
            referentiel.actionsEnfant
              .map((actionEnfant) => actionEnfant.referentielsOrigine || [])
              .flat()
              .concat(referentiel.referentielsOrigine || [])
          ).values(),
        ];
      }
    }
  }
}
