import { dcpTable } from '@/backend/auth/index-domain';
import {
  financeurTagTable,
  libreTagTable,
  partenaireTagTable,
  personneTagTable,
  serviceTagTable,
  structureTagTable,
} from '@/backend/collectivites/index-domain';
import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { countByDateSlots } from '@/backend/plans/fiches/count-by/count-by-date-slots.enum';
import {
  axeTable,
  ciblesEnumValues,
  ficheActionEffetAttenduTable,
  ficheActionFinanceurTagTable,
  ficheActionIndicateurTable,
  ficheActionLibreTagTable,
  ficheActionPartenaireTagTable,
  ficheActionResultatsAttenduValues,
  ficheActionServiceTagTable,
  ficheActionSousThematiqueTable,
  ficheActionStructureTagTable,
  ficheActionTable,
  ficheActionThematiqueTable,
  participationCitoyenneEnumValues,
  prioriteEnumValues,
  SANS_CIBLE_LABEL,
  SANS_FINANCEUR_TAG_LABEL,
  SANS_LIBRE_TAG_LABEL,
  SANS_PARTENAIRE_LABEL,
  SANS_PARTICIPATION_CITOYENNE_LABEL,
  SANS_PERSONNE_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_RESULTATS_ATTENDUS_LABEL,
  SANS_SERVICE_TAG_LABEL,
  SANS_SOUS_THEMATIQUE_LABEL,
  SANS_STATUT_LABEL,
  SANS_STRUCTURE_TAG_LABEL,
  SANS_THEMATIQUE_LABEL,
  statutsEnumValues,
} from '@/backend/plans/fiches/index-domain';
import {
  GetFichesActionFilterRequestType,
  TypePeriodeEnumType,
} from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import {
  effetAttenduTable,
  sousThematiqueTable,
  thematiqueTable,
} from '@/backend/shared/index-domain';
import { DatabaseService } from '@/backend/utils';
import {
  CountByRecordGeneralType,
  CountByResponseType,
} from '@/backend/utils/count-by.dto';
import { getModifiedSinceDate } from '@/backend/utils/modified-since.enum';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import {
  aliasedTable,
  and,
  arrayOverlaps,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { FicheActionWithRelationsType } from '../shared/models/fiche-action-with-relations.dto';
import { CountByPropertyEnumType } from './count-by-property-options.enum';

@Injectable()
export class CountByService {
  private readonly logger = new Logger(CountByService.name);

  private readonly FICHE_ACTION_PARTENAIRE_TAGS_QUERY_ALIAS =
    'ficheActionPartenaireTags';

  private readonly NULL_VALUE_KEY = 'null';

  constructor(private readonly databaseService: DatabaseService) {}

  getListAllowedValues(
    countByProperty: CountByPropertyEnumType
  ): readonly string[] | null {
    switch (countByProperty) {
      case 'statut':
        return statutsEnumValues;
      case 'priorite':
        return prioriteEnumValues;
      case 'effetsAttendus':
        return ficheActionResultatsAttenduValues;
      case 'cibles':
        return ciblesEnumValues;
      case 'participationCitoyenneType':
        return participationCitoyenneEnumValues;
      default:
        return null;
    }
  }

  getNullValueLabel(
    countByProperty: CountByPropertyEnumType
  ): string | undefined {
    switch (countByProperty) {
      case 'statut':
        return SANS_STATUT_LABEL;
      case 'priorite':
        return SANS_PRIORITE_LABEL;
      case 'effetsAttendus':
        return SANS_RESULTATS_ATTENDUS_LABEL;
      case 'cibles':
        return SANS_CIBLE_LABEL;
      case 'participationCitoyenneType':
        return SANS_PARTICIPATION_CITOYENNE_LABEL;
      case 'partenaires':
        return SANS_PARTENAIRE_LABEL;
      case 'services':
        return SANS_SERVICE_TAG_LABEL;
      case 'pilotes':
        return SANS_PERSONNE_PILOTE_LABEL;
      case 'tags':
        return SANS_LIBRE_TAG_LABEL;
      case 'thematiques':
        return SANS_THEMATIQUE_LABEL;
      case 'sousThematiques':
        return SANS_SOUS_THEMATIQUE_LABEL;
      case 'structures':
        return SANS_STRUCTURE_TAG_LABEL;
      case 'financeurs':
        return SANS_FINANCEUR_TAG_LABEL;
      case 'referents':
        return SANS_REFERENT_LABEL;

      default:
        return;
    }
  }

  initializeCountByMap(
    countByProperty: CountByPropertyEnumType,
    countByMap: CountByRecordGeneralType
  ) {
    if (countByProperty === 'budgetPrevisionnel') {
      countByMap['true'] = {
        label: 'Avec budget prévisionnel renseigné',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Sans budget prévisionnel renseigné',
        value: false,
        count: 0,
      };
    } else if (countByProperty === 'restreint') {
      countByMap['true'] = {
        label: 'Actions privées',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Actions ouvertes',
        value: false,
        count: 0,
      };
    } else if (countByProperty === 'ameliorationContinue') {
      countByMap['true'] = {
        label: 'Actions qui se répètent tous les ans',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Autres',
        value: false,
        count: 0,
      };
    } else if (countByProperty === 'indicateurs') {
      countByMap['true'] = {
        label: 'Avec indicateur(s) associé(s)',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Sans indicateur associé',
        value: false,
        count: 0,
      };
    } else if (
      countByProperty === 'dateFin' ||
      countByProperty === 'dateDebut' ||
      countByProperty === 'createdAt' ||
      countByProperty === 'modifiedAt'
    ) {
      countByDateSlots.forEach((dateSlot) => {
        countByMap[dateSlot.key] = {
          label: dateSlot.label,
          value: dateSlot.key,
          count: 0,
        };
      });
      countByMap[this.NULL_VALUE_KEY] = {
        label: 'Non renseignée',
        value: null,
        count: 0,
      };
      if (countByProperty === 'dateFin') {
        countByMap['ameliorationContinue'] = {
          label: 'En amélioration continue',
          value: 'ameliorationContinue',
          count: 0,
        };
      }
    } else {
      const allowedValues = this.getListAllowedValues(countByProperty);
      allowedValues?.forEach((allowedValue) => {
        countByMap[allowedValue] = {
          label: allowedValue,
          value: allowedValue,
          count: 0,
        };
      });
      countByMap[this.NULL_VALUE_KEY] = {
        label: this.getNullValueLabel(countByProperty),
        value: null,
        count: 0,
      };
    }
  }

  fillCountByMapWithFiche(
    fiche: FicheActionWithRelationsType,
    countByProperty: CountByPropertyEnumType,
    countByMap: CountByRecordGeneralType
  ) {
    if (
      countByProperty === 'statut' ||
      countByProperty === 'priorite' ||
      countByProperty === 'participationCitoyenneType'
    ) {
      const valueKey = fiche[countByProperty] || this.NULL_VALUE_KEY;
      if (!countByMap[valueKey]) {
        countByMap[valueKey] = {
          value: fiche[countByProperty],
          count: 0,
        };
      }
      countByMap[valueKey].count++;
    } else if (
      countByProperty === 'budgetPrevisionnel' ||
      countByProperty === 'restreint' ||
      countByProperty === 'ameliorationContinue' ||
      countByProperty === 'indicateurs'
    ) {
      let value = Boolean(fiche[countByProperty]);
      if (value && Array.isArray(value)) {
        value = Boolean(value.length);
      }
      const valueKey = `${value}`;
      if (!countByMap[valueKey]) {
        countByMap[valueKey] = {
          value: value,
          count: 0,
        };
      }
      countByMap[valueKey].count++;
    } else if (
      countByProperty === 'dateDebut' ||
      countByProperty === 'dateFin' ||
      countByProperty === 'createdAt' ||
      countByProperty === 'modifiedAt'
    ) {
      const value = fiche[countByProperty];
      if (!value) {
        if (countByProperty === 'dateFin' && fiche.ameliorationContinue) {
          countByMap['ameliorationContinue'].count++;
        } else {
          countByMap[this.NULL_VALUE_KEY].count++;
        }
      } else {
        const dateTime = DateTime.fromISO(value.replace(' ', 'T'));
        const nowDate = DateTime.now();
        const monthDuration = dateTime.diff(nowDate, 'months').months;
        const dateSlot = countByDateSlots.find(
          (dateSlot) =>
            (isNil(dateSlot.min_month_duration) ||
              monthDuration >= dateSlot.min_month_duration) &&
            (isNil(dateSlot.max_month_duration) ||
              monthDuration < dateSlot.max_month_duration)
        );
        if (dateSlot) {
          countByMap[dateSlot.key].count++;
        } else {
          this.logger.error(
            `Fiche action (id ${fiche.id}, collectiviteId: ${fiche.collectiviteId}) with invalid date slot: ${value} for ${countByProperty}`
          );
        }
      }
    } else if (countByProperty === 'cibles') {
      const valueArray = fiche[countByProperty] || [];
      if (valueArray.length) {
        valueArray.forEach((value) => {
          if (!countByMap[value]) {
            countByMap[value] = {
              value: value,
              label: value,
              count: 0,
            };
          }
          countByMap[value].count++;
        });
      } else {
        if (!countByMap[this.NULL_VALUE_KEY]) {
          countByMap[this.NULL_VALUE_KEY] = {
            value: null,
            count: 0,
          };
        }
        countByMap[this.NULL_VALUE_KEY].count++;
      }
    } else if (
      countByProperty === 'partenaires' ||
      countByProperty === 'services' ||
      countByProperty === 'plans' ||
      countByProperty === 'tags' ||
      countByProperty === 'thematiques' ||
      countByProperty === 'sousThematiques' ||
      countByProperty === 'structures' ||
      countByProperty === 'financeurs' ||
      countByProperty === 'effetsAttendus'
    ) {
      const valueArray = fiche[countByProperty] || [];
      if (valueArray.length) {
        valueArray.forEach((value) => {
          const valueKey = `${value.id}`;
          if (!countByMap[valueKey]) {
            countByMap[valueKey] = {
              value: value.id,
              label: value.nom,
              count: 0,
            };
          }
          countByMap[valueKey].count++;
        });
      } else {
        if (!countByMap[this.NULL_VALUE_KEY]) {
          countByMap[this.NULL_VALUE_KEY] = {
            value: null,
            count: 0,
          };
        }
        countByMap[this.NULL_VALUE_KEY].count++;
      }
    } else if (
      countByProperty === 'referents' ||
      countByProperty === 'pilotes'
    ) {
      const valueArray = fiche[countByProperty] || [];
      if (valueArray.length) {
        valueArray.forEach((value) => {
          const valueKey = `${value.tagId || value.userId}`;
          if (!countByMap[valueKey]) {
            countByMap[valueKey] = {
              value: value.tagId || value.userId,
              label: value.prenom ? `${value.prenom} ${value.nom}` : value.nom,
              count: 0,
            };
          }
          countByMap[valueKey].count++;
        });
      } else {
        if (!countByMap[this.NULL_VALUE_KEY]) {
          countByMap[this.NULL_VALUE_KEY] = {
            value: null,
            count: 0,
          };
        }
        countByMap[this.NULL_VALUE_KEY].count++;
      }
    } else {
      throw new NotImplementedException(
        `Count by ${countByProperty} not implemented`
      );
    }
  }

  async countByProperty(
    collectiviteId: number,
    countByProperty: CountByPropertyEnumType,
    filter: GetFichesActionFilterRequestType
  ) {
    this.logger.log(
      `Calcul du count by ${countByProperty} des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    // Fiches are limited in number, it's easier to count using typescript code rather than SQL
    const fiches = await this.getFichesAction(collectiviteId, filter);

    const countByResponse: CountByResponseType = {
      countByProperty,
      total: fiches.length,
      countByResult: {},
    };

    this.initializeCountByMap(countByProperty, countByResponse.countByResult);

    fiches.forEach((fiche) => {
      this.fillCountByMapWithFiche(
        fiche,
        countByProperty,
        countByResponse.countByResult
      );
    });

    return countByResponse;
  }

  private getFicheActionSousThematiquesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionSousThematiqueTable.ficheId,
        sousThematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionSousThematiqueTable.thematiqueId})`.as(
          'sous_thematique_ids'
        ),
        sousThematiques: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionSousThematiqueTable.thematiqueId}, 'nom', ${sousThematiqueTable.nom} ))`.as(
          'sous_thematiques'
        ),
      })
      .from(ficheActionSousThematiqueTable)
      .leftJoin(
        sousThematiqueTable,
        eq(sousThematiqueTable.id, ficheActionSousThematiqueTable.thematiqueId)
      )
      .groupBy(ficheActionSousThematiqueTable.ficheId)
      .as('ficheActionSousThematiques');
  }

  private getFicheActionThematiquesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionThematiqueTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
        thematiques: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom} ))`.as(
          'thematiques'
        ),
      })
      .from(ficheActionThematiqueTable)
      .leftJoin(
        thematiqueTable,
        eq(thematiqueTable.id, ficheActionThematiqueTable.thematiqueId)
      )
      .groupBy(ficheActionThematiqueTable.ficheId)
      .as('ficheActionThematiques');
  }

  private getFicheActionIndicateursQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionIndicateurTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionIndicateurTable.indicateurId})`.as(
          'indicateur_ids'
        ),
        indicateurs: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionIndicateurTable.indicateurId}, 'nom', ${indicateurDefinitionTable.titre} ))`.as(
          'indicateurs'
        ),
      })
      .from(ficheActionIndicateurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(
          indicateurDefinitionTable.id,
          ficheActionIndicateurTable.indicateurId
        )
      )
      .groupBy(ficheActionIndicateurTable.ficheId)
      .as('ficheActionIndicateurs');
  }

  private getFicheActionReferentTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionReferentTable.ficheId,
        referentTagIds: sql<
          number[]
        >`array_remove(array_agg(${ficheActionReferentTable.tagId}), NULL)`.as(
          'referent_tag_ids'
        ),
        referentUserIds: sql<
          string[]
        >`array_remove(array_agg(${ficheActionReferentTable.userId}::text), NULL)`.as(
          'referent_user_ids'
        ),
        referents: sql<
          {
            tagId: number | null;
            userId: string | null;
            nom: string;
            prenom?: string;
            email?: string;
          }[]
        >`array_agg(json_build_object('tagId', ${ficheActionReferentTable.tagId}, 'userId', ${ficheActionReferentTable.userId}, 'nom', COALESCE(${personneTagTable.nom}, ${dcpTable.nom}), 'prenom',  ${dcpTable.prenom}, 'email', ${dcpTable.email}))`.as(
          'referents'
        ),
      })
      .from(ficheActionReferentTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionReferentTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionReferentTable.userId))
      .groupBy(ficheActionReferentTable.ficheId)
      .as('ficheActionReferents');
  }

  private getFicheActionEffetsAttendusQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionEffetAttenduTable.ficheId,
        effetAttenduIds: sql<
          number[]
        >`array_agg(${ficheActionEffetAttenduTable.effetAttenduId})`.as(
          'effet_attendu_ids'
        ),
        effetsAttendus: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionEffetAttenduTable.effetAttenduId}, 'nom', ${effetAttenduTable.nom} ))`.as(
          'effets_attendus'
        ),
      })
      .from(ficheActionEffetAttenduTable)
      .leftJoin(
        effetAttenduTable,
        eq(effetAttenduTable.id, ficheActionEffetAttenduTable.effetAttenduId)
      )
      .groupBy(ficheActionEffetAttenduTable.ficheId)
      .as('ficheActionEffetsAttendus');
  }

  private getFicheActionFinanceurTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionFinanceurTagTable.ficheId,
        financeurTagIds: sql<
          number[]
        >`array_agg(${ficheActionFinanceurTagTable.financeurTagId})`.as(
          'financeur_tag_ids'
        ),
        financeurTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionFinanceurTagTable.financeurTagId}, 'nom', ${financeurTagTable.nom} ))`.as(
          'financeur_tags'
        ),
      })
      .from(ficheActionFinanceurTagTable)
      .leftJoin(
        financeurTagTable,
        eq(financeurTagTable.id, ficheActionFinanceurTagTable.financeurTagId)
      )
      .groupBy(ficheActionFinanceurTagTable.ficheId)
      .as('ficheActionFinanceurTags');
  }

  private getFicheActionLibreTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionLibreTagTable.ficheId,
        libreTagIds: sql<
          number[]
        >`array_agg(${ficheActionLibreTagTable.libreTagId})`.as(
          'libre_tag_ids'
        ),
        libreTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionLibreTagTable.libreTagId}, 'nom', ${libreTagTable.nom} ))`.as(
          'libre_tags'
        ),
      })
      .from(ficheActionLibreTagTable)
      .leftJoin(
        libreTagTable,
        eq(libreTagTable.id, ficheActionLibreTagTable.libreTagId)
      )
      .groupBy(ficheActionLibreTagTable.ficheId)
      .as('ficheActionLibreTags');
  }

  private getFicheActionStructureTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionStructureTagTable.ficheId,
        structureTagIds: sql<
          number[]
        >`array_agg(${ficheActionStructureTagTable.structureTagId})`.as(
          'structure_tag_ids'
        ),
        structureTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionStructureTagTable.structureTagId}, 'nom', ${structureTagTable.nom} ))`.as(
          'structure_tags'
        ),
      })
      .from(ficheActionStructureTagTable)
      .leftJoin(
        structureTagTable,
        eq(structureTagTable.id, ficheActionStructureTagTable.structureTagId)
      )
      .groupBy(ficheActionStructureTagTable.ficheId)
      .as('ficheActionStructureTags');
  }

  private getFicheActionPartenaireTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionPartenaireTagTable.ficheId,
        partenaireTagIds: sql<
          number[]
        >`array_agg(${ficheActionPartenaireTagTable.partenaireTagId})`.as(
          'partenaire_tag_ids'
        ),
        partenaireTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionPartenaireTagTable.partenaireTagId}, 'nom', ${partenaireTagTable.nom} ))`.as(
          'partenaire_tags'
        ),
      })
      .from(ficheActionPartenaireTagTable)
      .leftJoin(
        partenaireTagTable,
        eq(partenaireTagTable.id, ficheActionPartenaireTagTable.partenaireTagId)
      )
      .groupBy(ficheActionPartenaireTagTable.ficheId)
      .as(this.FICHE_ACTION_PARTENAIRE_TAGS_QUERY_ALIAS);
  }

  private getFicheActionAxesQuery() {
    const planTable = aliasedTable(axeTable, 'plan_table');
    const parentAxeTable = aliasedTable(axeTable, 'parent_axe_table');

    return this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        axeIds: sql<number[]>`array_agg(${ficheActionAxeTable.axeId})`.as(
          'axe_ids'
        ),
        axes: sql<
          {
            id: number;
            nom: string;
            parentId: number | null;
            parentNom: string | null;
          }[]
        >`array_agg(json_build_object('id', ${ficheActionAxeTable.axeId}, 'nom', ${axeTable.nom}, 'parentId', ${parentAxeTable.id}, 'parentNom', ${parentAxeTable.nom}))`.as(
          'axes'
        ),
        planIds: sql<
          number[]
        >`array_agg(COALESCE(${axeTable.plan}, ${axeTable.id}))`.as('plan_ids'),
        plans: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', COALESCE(${axeTable.plan}, ${axeTable.id}), 'nom', COALESCE(${planTable.nom}, ${axeTable.nom})))`.as(
          'plans'
        ),
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, and(eq(axeTable.id, ficheActionAxeTable.axeId)))
      .leftJoin(
        parentAxeTable,
        and(
          eq(axeTable.parent, parentAxeTable.id),
          isNotNull(parentAxeTable.parent)
        )
      )
      .leftJoin(planTable, eq(planTable.id, axeTable.plan))
      .groupBy(ficheActionAxeTable.ficheId)
      .as('ficheActionAxes');
  }

  private getFicheActionServiceTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionServiceTagTable.ficheId,
        serviceTagIds: sql<
          number[]
        >`array_agg(${ficheActionServiceTagTable.serviceTagId})`.as(
          'service_tag_ids'
        ),
        serviceTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionServiceTagTable.serviceTagId}, 'nom', ${serviceTagTable.nom} ))`.as(
          'service_tags'
        ),
      })
      .from(ficheActionServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, ficheActionServiceTagTable.serviceTagId)
      )
      .groupBy(ficheActionServiceTagTable.ficheId)
      .as('ficheActionServiceTag');
  }

  private getFicheActionPilotesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionPiloteTable.ficheId,
        piloteTagIds: sql<
          number[]
        >`array_remove(array_agg(${ficheActionPiloteTable.tagId}), NULL)`.as(
          'pilote_tag_ids'
        ),
        piloteUserIds: sql<
          string[]
        >`array_remove(array_agg(${ficheActionPiloteTable.userId}), NULL)`.as(
          'pilote_user_ids'
        ),
        pilotes: sql<
          {
            tagId: number | null;
            userId: string | null;
            nom: string;
            prenom?: string;
            email?: string;
          }[]
        >`array_agg(json_build_object('tagId', ${ficheActionPiloteTable.tagId}, 'userId', ${ficheActionPiloteTable.userId}, 'nom', COALESCE(${personneTagTable.nom}, ${dcpTable.nom}), 'prenom',  ${dcpTable.prenom}, 'email', ${dcpTable.email}))`.as(
          'pilotes'
        ),
      })
      .from(ficheActionPiloteTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionPiloteTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionPiloteTable.userId))
      .groupBy(ficheActionPiloteTable.ficheId)
      .as('ficheActionPilotes');
  }

  async getFichesAction(
    collectiviteId: number,
    filter: GetFichesActionFilterRequestType
  ): Promise<FicheActionWithRelationsType[]> {
    this.logger.log(
      `Récupération des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    const ficheActionPartenaireTags = this.getFicheActionPartenaireTagsQuery();
    const ficheActionThematiques = this.getFicheActionThematiquesQuery();
    const ficheActionSousThematiques =
      this.getFicheActionSousThematiquesQuery();
    const ficheActionFinanceurTags = this.getFicheActionFinanceurTagsQuery();
    const ficheActionIndicateurs = this.getFicheActionIndicateursQuery();
    const ficheActionReferent = this.getFicheActionReferentTagsQuery();
    const ficheActionEffetsAttendus = this.getFicheActionEffetsAttendusQuery();
    const ficheActionStructureTags = this.getFicheActionStructureTagsQuery();
    const ficheActionLibreTags = this.getFicheActionLibreTagsQuery();
    const ficheActionPilotes = this.getFicheActionPilotesQuery();
    const ficheActionServiceTags = this.getFicheActionServiceTagsQuery();
    const ficheActionAxes = this.getFicheActionAxesQuery();

    const conditions = this.getConditions(collectiviteId, filter);

    const fichesActionQuery = this.databaseService.db
      .select({
        ...getTableColumns(ficheActionTable),
        partenaires: ficheActionPartenaireTags.partenaireTags,
        pilotes: ficheActionPilotes.pilotes,
        tags: ficheActionLibreTags.libreTags,
        thematiques: ficheActionThematiques.thematiques,
        indicateurs: ficheActionIndicateurs.indicateurs,
        sousThematiques: ficheActionSousThematiques.sousThematiques,
        structures: ficheActionStructureTags.structureTags,
        financeurs: ficheActionFinanceurTags.financeurTags,
        effetsAttendus: ficheActionEffetsAttendus.effetsAttendus,
        referents: ficheActionReferent.referents,
        services: ficheActionServiceTags.serviceTags,
        axes: ficheActionAxes.axes,
        plans: ficheActionAxes.plans,
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPartenaireTags,
        eq(ficheActionPartenaireTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionReferent,
        eq(ficheActionReferent.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionIndicateurs,
        eq(ficheActionIndicateurs.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionEffetsAttendus,
        eq(ficheActionEffetsAttendus.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionStructureTags,
        eq(ficheActionStructureTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionFinanceurTags,
        eq(ficheActionFinanceurTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionLibreTags,
        eq(ficheActionLibreTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionThematiques,
        eq(ficheActionThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionSousThematiques,
        eq(ficheActionSousThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPilotes,
        eq(ficheActionPilotes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionServiceTags,
        eq(ficheActionServiceTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionAxes,
        eq(ficheActionAxes.ficheId, ficheActionTable.id)
      )
      .where(and(...conditions));

    return await fichesActionQuery;
  }

  private addArrayOverlapsConditionForStringArray(
    conditions: (SQLWrapper | SQL)[],
    column: SQL,
    filter?: string[]
  ) {
    if (filter?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlStringArray = `{${filter.map((val) => `"${val}"`).join(',')}}`;
      conditions.push(arrayOverlaps(column, sql`${sqlStringArray}`));
    }
  }

  private addArrayOverlapsConditionForIntArray(
    conditions: (SQLWrapper | SQL)[],
    column: SQL,
    filter?: number[]
  ) {
    if (filter?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.join(',')}}`;
      conditions.push(arrayOverlaps(column, sql`${sqlNumberArray}`));
    }
  }

  private getTimeColumn(typePeriode?: TypePeriodeEnumType) {
    switch (typePeriode) {
      case 'creation':
        return ficheActionTable.createdAt;
      case 'modification':
        return ficheActionTable.modifiedAt;
      case 'debut':
        return ficheActionTable.dateDebut;
      case 'fin':
        return ficheActionTable.dateFin;
      default:
        return ficheActionTable.modifiedAt;
    }
  }

  private getConditions(
    collectiviteId: number,
    filter: GetFichesActionFilterRequestType
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(ficheActionTable.collectiviteId, collectiviteId),
    ];

    if (filter.noStatut) {
      conditions.push(isNull(ficheActionTable.statut));
    }
    if (filter.statuts?.length) {
      conditions.push(inArray(ficheActionTable.statut, filter.statuts));
    }
    if (filter.noPriorite) {
      conditions.push(isNull(ficheActionTable.priorite));
    }
    if (filter.priorites?.length) {
      conditions.push(inArray(ficheActionTable.priorite, filter.priorites));
    }
    if (filter.budgetPrevisionnel) {
      conditions.push(isNotNull(ficheActionTable.budgetPrevisionnel));
    }
    if (filter.ameliorationContinue) {
      conditions.push(eq(ficheActionTable.ameliorationContinue, true));
    }
    if (filter.restreint) {
      conditions.push(eq(ficheActionTable.restreint, true));
    }
    if (filter.hasIndicateurLies) {
      conditions.push(isNotNull(sql`indicateur_ids`));
    }

    if (filter.cibles?.length) {
      conditions.push(arrayOverlaps(ficheActionTable.cibles, filter.cibles));
    }
    if (filter.modifiedSince) {
      const modifiedSinceDate = getModifiedSinceDate(filter.modifiedSince);
      conditions.push(gte(ficheActionTable.modifiedAt, modifiedSinceDate));
    }
    if (filter.modifiedAfter) {
      conditions.push(gte(ficheActionTable.modifiedAt, filter.modifiedAfter));
    }

    if (filter.debutPeriode) {
      conditions.push(
        gte(this.getTimeColumn(filter.typePeriode), filter.debutPeriode)
      );
    }

    if (filter.finPeriode) {
      conditions.push(
        lte(this.getTimeColumn(filter.typePeriode), filter.finPeriode)
      );
    }

    if (filter.partenaireIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`partenaire_tag_ids`,
        filter.partenaireIds
      );
    }
    if (filter.financeurIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`financeur_tag_ids`,
        filter.financeurIds
      );
    }
    if (filter.servicePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`service_tag_ids`,
        filter.servicePiloteIds
      );
    }
    if (filter.structurePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`structure_tag_ids`,
        filter.structurePiloteIds
      );
    }
    if (filter.libreTagsIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`libre_tag_ids`,
        filter.libreTagsIds
      );
    }
    if (filter.planActionIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`plan_ids`,
        filter.planActionIds
      );
    }
    if (filter.thematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`thematique_ids`,
        filter.thematiqueIds
      );
    }
    if (filter.sousThematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`sous_thematique_ids`,
        filter.sousThematiqueIds
      );
    }
    if (filter.noPilote) {
      const condition = and(
        isNull(sql`pilote_user_ids`),
        isNull(sql`pilote_tag_ids`)
      );
      conditions.push(condition!);
    }
    if (filter.noServicePilote) {
      conditions.push(isNull(sql`service_tag_ids`));
    }

    const piloteConditions: (SQLWrapper | SQL)[] = [];
    if (filter.utilisateurPiloteIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        piloteConditions,
        sql`pilote_user_ids`,
        filter.utilisateurPiloteIds
      );
    }
    if (filter.personnePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        piloteConditions,
        sql`pilote_tag_ids`,
        filter.personnePiloteIds
      );
    }
    if (piloteConditions.length) {
      if (piloteConditions.length === 1) {
        conditions.push(piloteConditions[0]);
      } else {
        conditions.push(or(...piloteConditions)!);
      }
    }

    const referentConditions: (SQLWrapper | SQL)[] = [];
    if (filter.utilisateurReferentIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        referentConditions,
        sql`referent_user_ids`,
        filter.utilisateurReferentIds
      );
    }
    if (filter.personneReferenteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        referentConditions,
        sql`referent_tag_ids`,
        filter.personneReferenteIds
      );
    }
    if (referentConditions.length) {
      if (referentConditions.length === 1) {
        conditions.push(referentConditions[0]);
      } else {
        conditions.push(or(...referentConditions)!);
      }
    }

    return conditions;
  }
}
