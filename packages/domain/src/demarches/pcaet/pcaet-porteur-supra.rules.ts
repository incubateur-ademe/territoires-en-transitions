import * as z from 'zod/mini';
import type { CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import { demarchePcaetStatusSchema } from './demarche-pcaet-status.enum.schema';

/**
 * Le type d'un Supra qui dépose un PCAET pour le compte de plusieurs EPCI à
 * fiscalité propre. Il donne le libellé « Porté par {type} » vu par les EPCI
 * couverts et les services de l'État.
 */
export const TypePorteurSupraEnum = {
  PETR: 'petr',
  POLE_METROPOLITAIN: 'pole_metropolitain',
  SYNDICAT_MIXTE: 'syndicat_mixte',
  SYNDICAT_INTERCOMMUNAL: 'syndicat_intercommunal',
} as const;

export type TypePorteurSupra =
  (typeof TypePorteurSupraEnum)[keyof typeof TypePorteurSupraEnum];

const NATURE_TO_TYPE_PORTEUR_SUPRA: Partial<
  Record<CollectiviteNatureType, TypePorteurSupra>
> = {
  PETR: TypePorteurSupraEnum.PETR,
  POLEM: TypePorteurSupraEnum.POLE_METROPOLITAIN,
  SMF: TypePorteurSupraEnum.SYNDICAT_MIXTE,
  SMO: TypePorteurSupraEnum.SYNDICAT_MIXTE,
  SIVU: TypePorteurSupraEnum.SYNDICAT_INTERCOMMUNAL,
  SIVOM: TypePorteurSupraEnum.SYNDICAT_INTERCOMMUNAL,
};

/** `null` pour un EPCI à fiscalité propre, une commune ou une nature inconnue. */
export const getTypePorteurSupra = (
  natureInsee: CollectiviteNatureType | null
): TypePorteurSupra | null =>
  natureInsee === null
    ? null
    : NATURE_TO_TYPE_PORTEUR_SUPRA[natureInsee] ?? null;

/**
 * La collectivité peut-elle déposer un PCAET pour le compte d'EPCI à fiscalité
 * propre ? Vrai pour les syndicats et les pôles (PETR, pôle métropolitain).
 *
 * Ne pas confondre avec `isSyndicat` des trajectoires, qui range les EPT parmi
 * les syndicats : un EPT est un EPCI à fiscalité propre, il porte son propre
 * PCAET.
 */
export const estNatureSupraPcaet = (
  natureInsee: CollectiviteNatureType | null
): boolean => getTypePorteurSupra(natureInsee) !== null;

/**
 * Un EPCI que le Supra peut cocher en créant son dépôt : un de ses membres
 * d'après BANATIC. La liste ne fait que proposer ; c'est le Supra qui coche.
 */
export const epciCandidatSchema = z.object({
  id: z.number(),
  nom: z.string(),
  departementCode: z.nullable(z.string()),
  /** La démarche PCAET propre la plus récente de l'EPCI, s'il en a une. */
  derniereDemarche: z.nullable(
    z.object({
      status: demarchePcaetStatusSchema,
      /** Date de lancement saisie, ou à défaut date de création (ISO 8601). */
      dateDebut: z.string(),
    })
  ),
});

export type EpciCandidat = z.infer<typeof epciCandidatSchema>;

/** Un EPCI couvert par le PCAET d'un Supra. */
export type CollectiviteCouverte = { id: number; nom: string };
