'use client';

import {
  PcaetInstructionPartieEnum,
  pcaetInstructionPartieValues,
} from '@tet/domain/demarches';
import { createSerializer, parseAsStringLiteral, useQueryState } from 'nuqs';

const ETAPE_PARAM = 'etape';

const etapeParser = parseAsStringLiteral(
  pcaetInstructionPartieValues
).withDefault(PcaetInstructionPartieEnum.DIAGNOSTIC);

/** L'étape ouverte du dossier d'instruction, portée par l'URL (?etape=). */
export const useEtapeInstructionQueryState = () =>
  useQueryState(ETAPE_PARAM, etapeParser);

export const serializeEtapeInstructionQueryState = createSerializer({
  [ETAPE_PARAM]: etapeParser,
});
