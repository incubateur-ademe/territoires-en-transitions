import {z} from 'zod';
import {valeurSchema} from "./valeur.schema";
import {tagSchema} from "../../shared/domain/tag.schema";
import {actionSchema} from "../../referentiel/domain/action.schema";
import {categorieSchema} from "./categorie.schema";
import {thematiqueSchema} from "../../shared/domain/thematique.schema";
import {resumeSchema} from "../../fiche_actions/domain/resume.schema";
import {personneSchema} from "../../shared/domain/personne.schema";

/**
 * Schéma zod à fusionner à une définition pour avoir les valeurs
 */
const plusValeur = z.object({
    valeurs : valeurSchema.array()
});

/**
 * Schéma zod à fusionner à une définition pour avoir les données annexes aux indicateurs
 */
const plusDetailsCollectivite = z.object({
    services : z.number().array(), // Lise d'id
    pilotes : personneSchema.array(),
    fiches : resumeSchema.array(),
    fichesNonClassees : resumeSchema.array(),
    categoriesUtilisateur : tagSchema.array()
});

/**
 * Schéma zod de la définition d'un indicateur à créer
 */
export const indicateurDefinitionSchemaInsert = z.object ({
    titre : z.string(),
    collectiviteId : z.number(),
    unite : z.string().optional(),
    description : z.string().optional(),
    thematiques : thematiqueSchema.array().optional()
});

/**
 * Type TS de la définition d'un indicateur à créer
 */
export type IndicateurDefinitionInsert = z.input<typeof indicateurDefinitionSchemaInsert>;


/**
 * Schéma zod d'un élément d'une liste d'indicateurs
 */
export const indicateurListItemSchema = z.object ({
    id : z.number(),
    titre : z.string()
});
/**
 * Type TS d'un élément d'une liste d'indicateurs
 */
export type IndicateurListItem = z.input<typeof indicateurListItemSchema>;

/**
 * Schéma zod d'un indicateur pour un affichage en graphique
 */
export const IndicateurChartInfoSchema = z.object ({
    id : z.number(),
    titre: z.string(),
    titreLong : z.string().nullable(),
    unite: z.string(),
    rempli: z.boolean(),
    confidentiel: z.boolean(),
    participationScore: z.boolean(),
    sansValeur : z.boolean().nullable(),
    enfants: z.object({
        id : z.number(),
        rempli : z.boolean()
    }).array().nullable(),
    count: z.number().nullable(),
    total: z.number().nullable(),
    valeurs : z.object({
        annee : z.number(),
        resultat : z.number(),
        objectif : z.number()
    }).array().nullable()
});

/**
 * Type TS d'un indicateur pour un affichage en graphique
 */
export type IndicateurChartInfo = z.input<typeof IndicateurChartInfoSchema>;

/**
 * Schéma zod de la définition d'un indicateur
 */
export const definitionSchema = z.object({
    id : z.number().readonly(),
    groupementId : z.number().nullable(),
    collectiviteId : z.number().nullable(), // perso
    identifiant : z.string().nullable().readonly(),
    titre : z.string(),
    titreLong : z.string().nullable(),
    description : z.string().nullable(),
    unite : z.string(),
    borneMin : z.number().nullable(),
    borneMax : z.number().nullable(),
    participationScore : z.boolean().readonly(),
    sansValeur : z.boolean(),
    commentaire : z.string().nullable(),
    confidentiel : z.boolean(),
    rempli : z.boolean().readonly(),
    estPerso : z.boolean().readonly(),
    actions : actionSchema.array(),
    type : categorieSchema.readonly(),
    programmes : categorieSchema.array().readonly(),
    prioritaire : z.boolean().readonly(),
    thematiques : thematiqueSchema.array(),
    enfants : z.number().array().readonly(),
    parents : z.number().array().readonly()
});
/**
 * Type TS de la définition d'un indicateur
 */
export type IndicateurDefinition = z.input<typeof definitionSchema>;

/**
 * Schéma zod d'un indicateur avec toutes les informations annexes liées
 */
export const definitionCompleteSchema = definitionSchema
    .merge(plusValeur)
    .merge(plusDetailsCollectivite);
/**
 * Type TS d'un indicateur avec toutes les informations annexes liées
 */
export type IndicateurDefinitionComplet = z.input<typeof definitionCompleteSchema>;

/**
 * Schéma zod d'un indicateur personnalisé
 */
export const definitionPersonaliseSchema = definitionSchema
    .omit({
        identifiant : true,
        type : true,
        programmes : true,
        sansValeur: true,
        participationScore: true,
        enfants : true,
        parents : true
    });
/**
 * Type TS d'un indicateur personnalisé
 */
export type IndicateurDefinitionPersonalise = z.input<typeof definitionPersonaliseSchema>;

/**
 * Schéma zod d'un indicateur prédéfini
 */
export const definitionPredefiniSchema = definitionSchema
    .omit({
        collectiviteId : true
    });
/**
 * Type TS d'un indicateur prédéfini
 */
export type IndicateurDefinitionPredefini = z.input<typeof definitionPredefiniSchema>;

