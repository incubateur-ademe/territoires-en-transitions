import type { IdentiteField } from '@tet/backend/utils/expression-parser/evaluate-identite';
import {
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
  IdentiteCollectivite,
} from '@tet/domain/collectivites';

/**
 * Version des règles de rendu des textes balisés : à incrémenter quand les
 * alias, les champs de variante, leurs valeurs de référence ou les règles de
 * rendu changent, car le résultat change alors sans que la version du
 * référentiel change. Fait partie de la clé de variante, donc des caches.
 *
 * ⚠ Le rendu par défaut est calculé à l'import et stocké dans les colonnes de
 * `action_definition`, et les définitions sont mises en cache côté front avec
 * la seule version du référentiel pour clé : après un changement de cette
 * constante, réimporter les référentiels balisés avec une nouvelle version.
 */
export const TEMPLATE_RENDER_VERSION = 1;

type TemplateVariantFieldDefinition = {
  /** Valeurs possibles, en minuscules ; la première est la valeur de référence */
  values: readonly [string, ...string[]];
  /** Valeur du champ pour une collectivité réelle */
  fromIdentite: (identite: IdentiteCollectivite) => string;
  /** Applique une valeur à l'identité d'évaluation */
  applyToIdentite: (
    identite: IdentiteCollectivite,
    value: string
  ) => IdentiteCollectivite;
};

/**
 * Champs d'identité utilisables dans les balises, avec leurs valeurs. Un champ
 * absent d'ici est refusé dans les balises : il faut d'abord lui choisir une
 * valeur de référence (celle du rendu par défaut).
 */
export const TEMPLATE_VARIANT_FIELDS = {
  localisation: {
    values: ['metropole', 'dom'],
    // `drom` à `null` (collectivités de test) : rendu par défaut
    fromIdentite: (identite) => (identite.drom ? 'dom' : 'metropole'),
    applyToIdentite: (identite, value) => ({
      ...identite,
      drom: value === 'dom',
    }),
  },
} as const satisfies Partial<
  Record<IdentiteField, TemplateVariantFieldDefinition>
>;

export type TemplateVariantField = keyof typeof TEMPLATE_VARIANT_FIELDS;

/** Valeur de chaque champ de variante : un profil de collectivité */
export type TemplateVariant = Record<TemplateVariantField, string>;

const TEMPLATE_VARIANT_FIELD_NAMES = (
  Object.keys(TEMPLATE_VARIANT_FIELDS) as TemplateVariantField[]
).sort();

export function isTemplateVariantField(
  field: string
): field is TemplateVariantField {
  return Object.hasOwn(TEMPLATE_VARIANT_FIELDS, field);
}

/** Profil de référence : celui du rendu par défaut stocké en base */
export const TEMPLATE_REFERENCE_VARIANT: TemplateVariant = Object.fromEntries(
  TEMPLATE_VARIANT_FIELD_NAMES.map((field) => [
    field,
    TEMPLATE_VARIANT_FIELDS[field].values[0],
  ])
) as TemplateVariant;

export function isReferenceVariant(variant: TemplateVariant): boolean {
  return TEMPLATE_VARIANT_FIELD_NAMES.every(
    (field) => variant[field] === TEMPLATE_REFERENCE_VARIANT[field]
  );
}

export function getTemplateVariant(
  identite: IdentiteCollectivite
): TemplateVariant {
  return Object.fromEntries(
    TEMPLATE_VARIANT_FIELD_NAMES.map((field) => [
      field,
      TEMPLATE_VARIANT_FIELDS[field].fromIdentite(identite).toLowerCase(),
    ])
  ) as TemplateVariant;
}

/**
 * Clé de variante d'une collectivité : `null` pour le profil de référence
 * (rien à surcharger), sinon une chaîne lisible et stable, par exemple
 * `r1;localisation=dom`. Elle ne dépend que des champs de variante : toutes
 * les collectivités du même profil la partagent.
 */
export function buildTextVariantKey(
  identite: IdentiteCollectivite
): string | null {
  return getTextVariantKey(getTemplateVariant(identite));
}

export function getTextVariantKey(variant: TemplateVariant): string | null {
  if (isReferenceVariant(variant)) {
    return null;
  }
  return [
    `r${TEMPLATE_RENDER_VERSION}`,
    ...TEMPLATE_VARIANT_FIELD_NAMES.map(
      (field) => `${field}=${variant[field]}`
    ),
  ].join(';');
}

/**
 * Inverse de `getTextVariantKey`. `null` si la clé est invalide : version de
 * rendu périmée, champ inconnu ou manquant, valeur inconnue.
 */
export function parseTextVariantKey(key: string): TemplateVariant | null {
  const [version, ...pairs] = key.split(';');
  if (version !== `r${TEMPLATE_RENDER_VERSION}`) {
    return null;
  }
  const variant: Partial<TemplateVariant> = {};
  for (const pair of pairs) {
    const [field, value, ...extra] = pair.split('=');
    if (
      extra.length ||
      !isTemplateVariantField(field) ||
      field in variant ||
      !(TEMPLATE_VARIANT_FIELDS[field].values as readonly string[]).includes(
        value
      )
    ) {
      return null;
    }
    variant[field] = value;
  }
  if (TEMPLATE_VARIANT_FIELD_NAMES.some((field) => !(field in variant))) {
    return null;
  }
  return variant as TemplateVariant;
}

const REFERENCE_IDENTITE: IdentiteCollectivite = {
  type: CollectiviteTypeEnum.EPCI,
  soustype: CollectiviteSousTypeEnum.EPCI_FP,
  populationTags: [],
  drom: false,
  dansAireUrbaine: null,
};

/**
 * Seule identité sur laquelle les conditions des balises sont évaluées : une
 * identité complète, faite des valeurs de la variante. On n'évalue jamais sur
 * l'identité réelle (`drom` à `null` répondrait faux à la fois à `dom` et à
 * `metropole`). Les champs hors variante ne sont jamais lus : les balises les
 * refusent.
 */
export function buildTemplateIdentite(
  variant: TemplateVariant
): IdentiteCollectivite {
  return TEMPLATE_VARIANT_FIELD_NAMES.reduce(
    (identite, field) =>
      TEMPLATE_VARIANT_FIELDS[field].applyToIdentite(identite, variant[field]),
    REFERENCE_IDENTITE
  );
}

/** Tous les profils possibles, le profil de référence en premier. */
export function listTemplateVariants(): TemplateVariant[] {
  return TEMPLATE_VARIANT_FIELD_NAMES.reduce<TemplateVariant[]>(
    (variants, field) =>
      variants.flatMap((variant) =>
        TEMPLATE_VARIANT_FIELDS[field].values.map((value) => ({
          ...variant,
          [field]: value,
        }))
      ),
    [{} as TemplateVariant]
  );
}
