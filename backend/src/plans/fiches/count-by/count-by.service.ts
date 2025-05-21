import { countByDateSlots } from '@/backend/plans/fiches/count-by/count-by-date-slots.enum';
import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import {
  ciblesEnumValues,
  ficheActionResultatsAttenduValues,
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
import { GetFilteredFichesRequestType } from '@/backend/plans/fiches/shared/get-fiches-filter.request';
import {
  CountByRecordGeneralType,
  CountByResponseType,
} from '@/backend/utils/count-by.dto';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { FicheActionWithRelationsType } from '../shared/models/fiche-action-with-relations.dto';
import { CountByPropertyEnumType } from './count-by-property-options.enum';

@Injectable()
export class CountByService {
  private readonly logger = new Logger(CountByService.name);

  private readonly NULL_VALUE_KEY = 'null';

  constructor(
    private readonly ficheActionListService: FicheActionListService
  ) {}

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
    if (countByProperty.startsWith('budgets')) {
      countByMap['true'] = {
        label: 'Avec budget renseigné',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Sans budget renseigné',
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
    if (countByProperty.startsWith('budgets')) {
      const budgets = fiche.budgets || [];

      const valueKey = budgets.some((budget) => {
        const isTypeMatch =
          budget.type ===
          (countByProperty.includes('Investissement')
            ? 'investissement'
            : 'fonctionnement');

        const isPrevisionnel = countByProperty.includes('Previsionnel')
          ? budget.budgetPrevisionnel !== null &&
            budget.budgetPrevisionnel !== undefined
          : budget.budgetReel !== null && budget.budgetReel !== undefined;

        const isTotal = countByProperty.includes('Total')
          ? budget.annee === null || budget.annee === undefined
          : budget.annee !== null && budget.annee !== undefined;

        return isTypeMatch && isPrevisionnel && isTotal;
      });
      if (!countByMap[valueKey.toString()]) {
        countByMap[valueKey.toString()] = {
          value: valueKey,
          count: 0,
        };
      }
      countByMap[valueKey.toString()].count++;
    } else if (
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
          const valueKey = `${value.tagId || value.userId || null}`;
          if (!countByMap[valueKey]) {
            countByMap[valueKey] = {
              value: value.tagId || value.userId || null,
              label: value.nom || '',
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
    filter: GetFilteredFichesRequestType
  ) {
    this.logger.log(
      `Calcul du count by ${countByProperty} des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    // Fiches are limited in number, it's easier to count using typescript code rather than SQL
    const fiches = await this.ficheActionListService.getFichesAction(
      collectiviteId,
      filter
    );

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
}
