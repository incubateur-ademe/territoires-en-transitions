import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  upsertIndicateurFichesSpecificErrors,
  upsertIndicateurFichesTrpcErrorEntries,
} from '../upsert-indicateur-fiches/upsert-indicateur-fiches.errors';

const specificErrors = [
  ...upsertIndicateurFichesSpecificErrors,
  'PARENT_NOT_FOUND',
  'SOUS_INDICATEUR_SELF_REFERENCE',
  'SOUS_INDICATEUR_PARENT_NOT_PERSO',
  'SOUS_INDICATEUR_CHILD_NOT_PERSO',
  'SOUS_INDICATEUR_DIFFERENT_COLLECTIVITE',
  'SOUS_INDICATEUR_PARENT_ALREADY_CHILD',
  'SOUS_INDICATEUR_CHILD_HAS_CHILDREN',
  'SOUS_INDICATEUR_CHILD_ALREADY_ATTACHED',
  'SOUS_INDICATEUR_DIFFERENT_UNITE',
  'SOUS_INDICATEUR_DIFFERENT_PERIODICITE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const createIndicateurErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ...upsertIndicateurFichesTrpcErrorEntries,
      PARENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'indicateur parent n'a pas été trouvé",
      },
      SOUS_INDICATEUR_SELF_REFERENCE: {
        code: 'BAD_REQUEST',
        message: 'Un indicateur ne peut pas être son propre sous-indicateur',
      },
      SOUS_INDICATEUR_PARENT_NOT_PERSO: {
        code: 'BAD_REQUEST',
        message:
          'Un sous-indicateur ne peut être ajouté qu’à un indicateur personnalisé',
      },
      SOUS_INDICATEUR_CHILD_NOT_PERSO: {
        code: 'BAD_REQUEST',
        message: 'Un sous-indicateur doit être un indicateur personnalisé',
      },
      SOUS_INDICATEUR_DIFFERENT_COLLECTIVITE: {
        code: 'BAD_REQUEST',
        message:
          'Le sous-indicateur et son parent doivent appartenir à la même collectivité',
      },
      SOUS_INDICATEUR_PARENT_ALREADY_CHILD: {
        code: 'BAD_REQUEST',
        message: 'Le parent est déjà un sous-indicateur : deux niveaux maximum',
      },
      SOUS_INDICATEUR_CHILD_HAS_CHILDREN: {
        code: 'BAD_REQUEST',
        message:
          'Le sous-indicateur a déjà des sous-indicateurs : deux niveaux maximum',
      },
      SOUS_INDICATEUR_CHILD_ALREADY_ATTACHED: {
        code: 'BAD_REQUEST',
        message: 'Le sous-indicateur est déjà rattaché à un autre indicateur',
      },
      SOUS_INDICATEUR_DIFFERENT_UNITE: {
        code: 'BAD_REQUEST',
        message: 'Le sous-indicateur doit avoir la même unité que son parent',
      },
      SOUS_INDICATEUR_DIFFERENT_PERIODICITE: {
        code: 'BAD_REQUEST',
        message:
          'Le sous-indicateur doit avoir la même périodicité que son parent',
      },
    },
  };

export const CreateIndicateurErrorEnum = createErrorsEnum(specificErrors);
export type CreateIndicateurError = keyof typeof CreateIndicateurErrorEnum;
