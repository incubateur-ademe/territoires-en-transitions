import {z} from 'zod';
import {niveauPrioritesSchema, statutsSchema} from "../fiche_resumes.list/domain/enum.schema";
import {personneSchema} from "../../shared/domain/personne.schema";
import {axeSchema} from "./axe.schema";

/**
 * Schéma zod d'un résumé d'une fiche action
 */
export const resumeSchema = z.object({
    ameliorationContinue : z.boolean(),
    collectiviteId : z.number(),
    dateFinProvisoire : z.string().date(),
    id : z.number(),
    modifiedAt : z.string().date(),
    niveauPriorite : niveauPrioritesSchema,
    pilotes : personneSchema.array(),
    plans : axeSchema.array(),
    restreint : z.boolean(),
    statut : statutsSchema,
    titre : z.string()
});

/**
 * Type TS d'un résumé d'une fiche action
 */
export type FicheResume = z.input<typeof resumeSchema>;
