import { countByDateSlots } from '@/backend/plans/fiches/count-by/count-by-date-slots.enum';
import {
  ciblesEnumValues,
  ficheActionResultatsAttenduValues,
  participationCitoyenneEnumValues,
  prioriteEnumValues,
  statutsEnumValues,
} from '@/backend/plans/fiches/index-domain';
import { ListFichesRequestFilters } from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import {
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
} from '@/backend/plans/fiches/shared/labels';
import {
  CountByRecordGeneralType,
  CountByResponseType,
} from '@/backend/utils/count-by.dto';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { isNil } from 'es-toolkit';
import { DateTime } from 'luxon';
import { FicheWithRelations } from '../list-fiches/fiche-action-with-relations.dto';
import { CountByPropertyEnumType } from './count-by-property-options.enum';

@Injectable()
export class CountByService {
  private readonly logger = new Logger(CountByService.name);

  private readonly NULL_VALUE_KEY = 'null';

  constructor(private readonly ficheActionListService: ListFichesService) {}

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
    const noLabels: Partial<Record<CountByPropertyEnumType, string>> = {
      statut: SANS_STATUT_LABEL,
      priorite: SANS_PRIORITE_LABEL,
      effetsAttendus: SANS_RESULTATS_ATTENDUS_LABEL,
      cibles: SANS_CIBLE_LABEL,
      participationCitoyenneType: SANS_PARTICIPATION_CITOYENNE_LABEL,
      partenaires: SANS_PARTENAIRE_LABEL,
      services: SANS_SERVICE_TAG_LABEL,
      pilotes: SANS_PERSONNE_PILOTE_LABEL,
      libreTags: SANS_LIBRE_TAG_LABEL,
      thematiques: SANS_THEMATIQUE_LABEL,
      sousThematiques: SANS_SOUS_THEMATIQUE_LABEL,
      structures: SANS_STRUCTURE_TAG_LABEL,
      financeurs: SANS_FINANCEUR_TAG_LABEL,
      referents: SANS_REFERENT_LABEL,
    };
    return noLabels[countByProperty] ?? '';
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
    } else if (countByProperty === 'actionsParMesuresDeReferentiels') {
      countByMap['true'] = {
        label: 'Avec actions par mesures de référentiels',
        value: true,
        count: 0,
      };
      countByMap['false'] = {
        label: 'Sans actions par mesures de référentiels',
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
    fiche: FicheWithRelations,
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
    } else if (countByProperty === 'notes') {
      const valueArray = fiche[countByProperty] || [];
      let yearNote: string = '';
      if (valueArray.length) {
        valueArray.forEach((value) => {
          if (value) {
            yearNote = value.dateNote.split('-')[0];
            if (!countByMap[yearNote]) {
              countByMap[yearNote] = {
                value: yearNote,
                label: yearNote,
                count: 0,
              };
            }
            countByMap[yearNote].count++;
          }
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
    } else if (countByProperty === 'financeurs') {
      const valueArray = fiche[countByProperty] || [];
      if (valueArray.length) {
        valueArray.forEach((value) => {
          const valueKey = `${value.financeurTag.id}`;
          if (!countByMap[valueKey]) {
            countByMap[valueKey] = {
              value: value.financeurTag.id,
              label: value.financeurTag.nom,
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
      countByProperty === 'partenaires' ||
      countByProperty === 'services' ||
      countByProperty === 'plans' ||
      countByProperty === 'libreTags' ||
      countByProperty === 'thematiques' ||
      countByProperty === 'sousThematiques' ||
      countByProperty === 'structures' ||
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
    } else if (countByProperty === 'actionsParMesuresDeReferentiels') {
      const value = fiche['mesures'];
      const hasMesuresLiees = value !== null && value.length > 0;
      const { key, label } = hasMesuresLiees
        ? { key: 'true', label: 'Avec mesures' }
        : { key: 'false', label: 'Sans mesures' };

      countByMap[key] = {
        value: hasMesuresLiees,
        count: countByMap[key]?.count + 1,
        label: label,
      };
    } else {
      throw new NotImplementedException(
        `Count by ${countByProperty} not implemented`
      );
    }
  }

  async countByProperty(
    collectiviteId: number,
    countByProperty: CountByPropertyEnumType,
    filter: ListFichesRequestFilters
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
