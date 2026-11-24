import { err, ok, type Result } from 'neverthrow'
import { z } from 'zod'
import { invalidRequest, type InvalidRequest } from '../application/estimate/estimation-error.ts'
import { batimentsMachinesAgricolesRequestSchema } from '../levers/batiments-machines-agricoles/index.ts'
import { dechetsModeDeTraitementRequestSchema } from '../levers/dechets-mode-de-traitement/index.ts'
import { dechetsSobrieteRequestSchema } from '../levers/dechets-sobriete/index.ts'
import { elevageDurableRequestSchema } from '../levers/elevage-durable/index.ts'
import { fertilisationAzoteeRequestSchema } from '../levers/fertilisation-azotee/index.ts'
import { haiesRequestSchema } from '../levers/haies/index.ts'
import { occupationDesSolsRequestSchema } from '../levers/occupation-des-sols/index.ts'
import { pratiquesStockantesRequestSchema } from '../levers/pratiques-stockantes/index.ts'
import { produitsBoisRequestSchema } from '../levers/produits-bois/index.ts'
import { reseauxChaleurRequestSchema } from '../levers/reseaux-chaleur/index.ts'
import { residentielChangementSystemeChauffageRequestSchema } from '../levers/residentiel-changement-systeme-chauffage/index.ts'
import { residentielRenovationRequestSchema } from '../levers/residentiel-renovation/index.ts'
import { residentielSobrieteRequestSchema } from '../levers/residentiel-sobriete/index.ts'
import { transportMarchandisesElectrificationRequestSchema } from '../levers/transport-marchandises-electrification/index.ts'
import { transportMarchandisesEfficaciteRequestSchema } from '../levers/transport-marchandises-efficacite/index.ts'
import { transportMarchandisesReportModalRequestSchema } from '../levers/transport-marchandises-report-modal/index.ts'
import { transportMarchandisesSobrieteLogistiqueRequestSchema } from '../levers/transport-marchandises-sobriete-logistique/index.ts'
import { transportPersonnesElectrificationRequestSchema } from '../levers/transport-personnes-electrification/index.ts'
import { transportPersonnesReportModalRequestSchema } from '../levers/transport-personnes-report-modal/index.ts'
import { transportPersonnesSobrieteDeplacementsRequestSchema } from '../levers/transport-personnes-sobriete-deplacements/index.ts'
import { transportPersonnesEfficaciteRequestSchema } from '../levers/transport-personnes-efficacite/index.ts'

const requestSchema = z.discriminatedUnion('id', [
  batimentsMachinesAgricolesRequestSchema,
  dechetsModeDeTraitementRequestSchema,
  dechetsSobrieteRequestSchema,
  elevageDurableRequestSchema,
  fertilisationAzoteeRequestSchema,
  haiesRequestSchema,
  occupationDesSolsRequestSchema,
  pratiquesStockantesRequestSchema,
  produitsBoisRequestSchema,
  reseauxChaleurRequestSchema,
  residentielChangementSystemeChauffageRequestSchema,
  residentielRenovationRequestSchema,
  residentielSobrieteRequestSchema,
  transportMarchandisesEfficaciteRequestSchema,
  transportMarchandisesElectrificationRequestSchema,
  transportMarchandisesReportModalRequestSchema,
  transportMarchandisesSobrieteLogistiqueRequestSchema,
  transportPersonnesEfficaciteRequestSchema,
  transportPersonnesElectrificationRequestSchema,
  transportPersonnesReportModalRequestSchema,
  transportPersonnesSobrieteDeplacementsRequestSchema,
])

type ParsedRequest = z.output<typeof requestSchema>

function parameterOf(issue: z.core.$ZodIssue): string {
  const unrecognizedKeys = issue.code === 'unrecognized_keys' ? issue.keys : []
  const parameter = [...issue.path.map(String), ...unrecognizedKeys].join('.')
  return parameter === '' ? 'request' : parameter
}

function messageOf(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_type' && issue.path.length === 0) return 'expected an object'
  if (issue.code === 'invalid_union' && issue.path.join('.') === 'id') return 'unknown lever'
  return issue.message
}

function parseRequest(input: unknown): Result<ParsedRequest, InvalidRequest> {
  const parsed = requestSchema.safeParse(input)
  if (parsed.success) return ok(parsed.data)
  return err(
    invalidRequest(
      parsed.error.issues.map((issue) => ({ parameter: parameterOf(issue), message: messageOf(issue) })),
    ),
  )
}

export { parseRequest, requestSchema }
export type { ParsedRequest }
