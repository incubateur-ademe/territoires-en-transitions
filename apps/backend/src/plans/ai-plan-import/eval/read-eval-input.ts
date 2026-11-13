import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';
import {
  detectSourceMimeType,
  DOCX_MIME,
} from '../enqueue-import/detect-source-mime-type';
import {
  AiPlanImportProfileEnum,
  aiPlanImportProfileSchema,
} from '../models/import-profile';
import type { EvalRun, ManualReference } from './eval-metrics';

const DECLARED_MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.docx': DOCX_MIME,
};

const USAGE = `Usage : run-ai-import-eval --file <pdf|docx|xlsx|csv> [--out <json>] [--ref <json>]
  [--instructions "<consignes>"] [--no-verifications] [--no-sous-actions]
  [--profile generic|pcaet|annexe-3-electrification]
       --profile annexe-3-electrification : DOCX V4, aide IA ciblée si nécessaire, références non résolues
       (appels réels possibles : lancement humain uniquement)
       (incompatible avec --ref, --instructions, --no-verifications, --no-sous-actions et --lecture-seule)
       run-ai-import-eval --file <xlsx|csv> --lecture-seule   (aucun appel au modèle)`;

type EvalFile = {
  file: string;
  out: string | undefined;
  buffer: Buffer;
  mimeType: string;
};

export type GenericEvalInput = EvalFile & {
  mode: 'generic';
  reference: EvalRun | ManualReference | null;
  options: {
    profile:
      | typeof AiPlanImportProfileEnum.GENERIC
      | typeof AiPlanImportProfileEnum.PCAET;
    withSecteurs: boolean;
    instructions: string;
    withVerifications: boolean;
    withSousActions: boolean;
  };
};

export type EvalInput =
  | GenericEvalInput
  | (EvalFile & { mode: 'electrification' })
  | (EvalFile & { mode: 'workbook' });

type EvalExit = { mode: 'exit'; code: number; message: string };

/** Valide les options et les fichiers avant tout démarrage de Nest ou du modèle. */
export const readEvalInput = async (): Promise<EvalInput | EvalExit> => {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
      out: { type: 'string' },
      ref: { type: 'string' },
      profile: { type: 'string', default: AiPlanImportProfileEnum.GENERIC },
      instructions: { type: 'string', default: '' },
      'no-verifications': { type: 'boolean', default: false },
      'no-sous-actions': { type: 'boolean', default: false },
      'lecture-seule': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help || !values.file) {
    return { mode: 'exit', code: values.help ? 0 : 1, message: USAGE };
  }
  const profile = aiPlanImportProfileSchema.safeParse(values.profile);
  if (!profile.success) {
    return {
      mode: 'exit',
      code: 1,
      message: `✗ Profil inconnu : ${values.profile}`,
    };
  }
  const electrification =
    profile.data === AiPlanImportProfileEnum.ELECTRIFICATION;
  if (
    electrification &&
    (values.ref !== undefined ||
      values.instructions !== '' ||
      values['no-verifications'] ||
      values['no-sous-actions'] ||
      values['lecture-seule'])
  ) {
    return {
      mode: 'exit',
      code: 1,
      message:
        '✗ Le profil Électrification accepte seulement --file, --out et --profile ; les options du parcours générique ne sont pas applicables.',
    };
  }

  const buffer = await readFile(values.file);
  const declaredMime =
    DECLARED_MIME_BY_EXTENSION[extname(values.file).toLowerCase()] ?? '';
  const mimeType = detectSourceMimeType(buffer, declaredMime);
  if (mimeType === null) {
    return {
      mode: 'exit',
      code: 1,
      message: `✗ Format non supporté : ${values.file}`,
    };
  }
  const source = { file: values.file, out: values.out, buffer, mimeType };
  if (profile.data === AiPlanImportProfileEnum.ELECTRIFICATION) {
    return mimeType === DOCX_MIME
      ? { ...source, mode: 'electrification' }
      : {
          mode: 'exit',
          code: 1,
          message:
            '✗ Le profil Électrification accepte uniquement le canevas officiel V4 au format DOCX.',
        };
  }
  if (values['lecture-seule']) {
    return { ...source, mode: 'workbook' };
  }
  // Une référence illisible arrête tout avant le premier appel payant.
  const reference = values.ref
    ? (JSON.parse(await readFile(values.ref, 'utf-8')) as
        | EvalRun
        | ManualReference)
    : null;
  return {
    ...source,
    mode: 'generic',
    reference,
    options: {
      profile: profile.data,
      withSecteurs: profile.data === AiPlanImportProfileEnum.PCAET,
      instructions: values.instructions,
      withVerifications: !values['no-verifications'],
      withSousActions: !values['no-sous-actions'],
    },
  };
};
