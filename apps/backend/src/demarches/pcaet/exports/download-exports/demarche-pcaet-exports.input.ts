import { z } from 'zod';
import { DEMARCHE_PCAET_EXPORT_KINDS } from './resolve-demarche-pcaet-exports.rules';

/**
 * Ce qui désigne le dépôt dont on veut les classeurs : la saisine pour un
 * service instructeur, la démarche et sa collectivité pour la déposante ou un
 * membre d'un EPCI couvert.
 */
const parSaisineShape = { demandeAvisId: z.number().int().positive() };
/** Les identifiants sont des `int4` : au-delà, une erreur de saisie. */
const INT4_MAX = 2_147_483_647;

const parDemarcheShape = {
  demarcheId: z.number().int().positive().max(INT4_MAX),
  collectiviteId: z.number().int().positive(),
};

/**
 * Objets stricts : une clé qui mélange les deux formes est refusée, au lieu
 * d'être réduite en silence à la première qui passe.
 */
export const demarchePcaetExportRefSchema = z.union([
  z.strictObject(parSaisineShape),
  z.strictObject(parDemarcheShape),
]);
export type DemarchePcaetExportRef = z.infer<
  typeof demarchePcaetExportRefSchema
>;

export const demarchePcaetExportKindSchema = z.enum(
  DEMARCHE_PCAET_EXPORT_KINDS
);

export const listDemarchePcaetExportsInputSchema = demarchePcaetExportRefSchema;

export const getDemarchePcaetExportUrlInputSchema = z.union([
  z.strictObject({ ...parSaisineShape, type: demarchePcaetExportKindSchema }),
  z.strictObject({ ...parDemarcheShape, type: demarchePcaetExportKindSchema }),
]);
export type GetDemarchePcaetExportUrlInput = z.infer<
  typeof getDemarchePcaetExportUrlInputSchema
>;

/**
 * Les mêmes clés en paramètres de requête, pour le contrôleur de l'export du
 * jour. Un objet et non une union, que la classe de DTO ne sait pas étendre :
 * l'exclusivité se vérifie à part.
 */
export const onDemandPcaetExportQuerySchema = z
  .object({
    type: demarchePcaetExportKindSchema,
    demandeAvisId: z.coerce.number().int().positive().optional(),
    demarcheId: z.coerce.number().int().positive().max(INT4_MAX).optional(),
    collectiviteId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    ({ demandeAvisId, demarcheId, collectiviteId }) =>
      demandeAvisId !== undefined
        ? demarcheId === undefined && collectiviteId === undefined
        : demarcheId !== undefined && collectiviteId !== undefined,
    {
      message:
        'Renseignez soit demandeAvisId, soit demarcheId et collectiviteId',
    }
  );
export type OnDemandPcaetExportQuery = z.infer<
  typeof onDemandPcaetExportQuerySchema
>;

export const toDemarchePcaetExportRef = ({
  demandeAvisId,
  demarcheId,
  collectiviteId,
}: OnDemandPcaetExportQuery): DemarchePcaetExportRef =>
  demandeAvisId !== undefined
    ? { demandeAvisId }
    : {
        demarcheId: demarcheId as number,
        collectiviteId: collectiviteId as number,
      };

/** Sépare la clé du dépôt du reste de l'entrée, en gardant son discriminant. */
export const pickDemarchePcaetExportRef = (
  input: DemarchePcaetExportRef
): DemarchePcaetExportRef =>
  'demandeAvisId' in input
    ? { demandeAvisId: input.demandeAvisId }
    : { demarcheId: input.demarcheId, collectiviteId: input.collectiviteId };
