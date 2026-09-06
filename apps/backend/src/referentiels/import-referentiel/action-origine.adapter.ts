import { UnprocessableEntityException } from '@nestjs/common';
import {
  ActionDefinitionTag,
  ActionOrigine,
  ActionOrigineTexte,
  ReferentielDefinition,
  ReferentielId,
} from '@tet/domain/referentiels';

const ACTION_ID_REGEXP = /^[a-zA-Z]+_\d+(\.\d+)*$/;
const ORIGIN_NEW_ACTION_PREFIX = 'nouvelle';

type ParsedOrigineEntry = Readonly<{
  origineReferentielId: string;
  origineActionId: string;
  ponderation: number;
}>;

const parseOrigineEntries = (
  actionId: string,
  origineText: string,
  referentielDefinitions: ReferentielDefinition[],
  existingActionIds?: string[]
): ParsedOrigineEntry[] => {
  const entries: Record<string, ParsedOrigineEntry> = {};
  const lowerCaseOrigine = origineText.toLowerCase();
  if (lowerCaseOrigine.startsWith(ORIGIN_NEW_ACTION_PREFIX)) {
    return [];
  }

  const origineParts = lowerCaseOrigine
    .split('\n')
    .map((originePart) => originePart.trim());
  origineParts.forEach((originePart) => {
    const originePartPonderationSplit = originePart.split('(');
    let ponderation = 1;

    if (originePartPonderationSplit.length > 1) {
      ponderation = parseFloat(
        originePartPonderationSplit[1].replace(')', '').replace(',', '.')
      );
      if (isNaN(ponderation)) {
        throw new UnprocessableEntityException(
          `Invalid ponderation value ${originePartPonderationSplit[1]} for origine ${originePart} of action ${actionId}`
        );
      }
    }

    const origineActionId = originePartPonderationSplit[0].trim();
    const originePartReferentielSplit = origineActionId.split('_');
    if (
      originePartReferentielSplit.length !== 2 ||
      !ACTION_ID_REGEXP.test(origineActionId)
    ) {
      throw new UnprocessableEntityException(
        `Invalid origine value ${originePart} for action ${actionId}`
      );
    }

    const origineReferentielId = originePartReferentielSplit[0];
    if (
      !referentielDefinitions.some(
        (definition) => definition.id === origineReferentielId
      )
    ) {
      throw new UnprocessableEntityException(
        `Invalid origine value referentiel ${originePart} (referentiel ${origineReferentielId}) for action ${actionId}`
      );
    }

    if (existingActionIds && !existingActionIds.includes(origineActionId)) {
      throw new UnprocessableEntityException(
        `Invalid origine value action ${originePart} (extracted actionId ${origineActionId} not found) for action ${actionId}`
      );
    }

    if (entries[origineActionId]) {
      throw new UnprocessableEntityException(
        `Duplicate origine ${origineActionId} for action ${actionId}`
      );
    }
    entries[origineActionId] = {
      origineReferentielId,
      origineActionId,
      ponderation,
    };
  });

  return Object.values(entries);
};

export const parseActionsOrigine = (
  referentielId: ReferentielId,
  actionId: string,
  origine: string,
  referentielDefinitions: ReferentielDefinition[],
  existingActionIds?: string[]
): ActionOrigine[] =>
  parseOrigineEntries(
    actionId,
    origine,
    referentielDefinitions,
    existingActionIds
  ).map((entry) => ({
    referentielId,
    actionId,
    origineReferentielId: entry.origineReferentielId,
    origineActionId: entry.origineActionId,
    ponderation: entry.ponderation,
  }));

export const parseActionsOrigineTexte = (
  referentielId: ReferentielId,
  actionId: string,
  origineTexte: string,
  referentielDefinitions: ReferentielDefinition[],
  existingActionIds?: string[]
): ActionOrigineTexte[] =>
  parseOrigineEntries(
    actionId,
    origineTexte,
    referentielDefinitions,
    existingActionIds
  ).map((entry) => ({
    referentielId,
    actionId,
    origineReferentielId: entry.origineReferentielId,
    origineActionId: entry.origineActionId,
  }));

export const buildOrigineTags = (
  referentielId: ReferentielId,
  actionId: string,
  origineReferentielIds: Iterable<string>
): ActionDefinitionTag[] =>
  [...new Set(origineReferentielIds)].map((origineReferentielId) => ({
    referentielId,
    actionId,
    tagRef: origineReferentielId,
  }));
