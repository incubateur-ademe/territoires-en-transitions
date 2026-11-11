import {
  ElectrificationConfig,
  ElectrificationEngagementCodeEnum,
} from '@tet/domain/plans';
import { ElectrificationDataIssue } from './publish-electrification-data.input';
import { ElectrificationIssue } from '@tet/backend/plans/ai-plan-import/electrification/electrification-issue';

export const electrificationCatalogueErrors = {
  DUPLICATE_CATALOGUE_REFERENCE:
    'Une référence du catalogue est présente plusieurs fois.',
  INVALID_CATALOGUE_PARENT:
    'Une référence du catalogue désigne un axe inexistant.',
  INVALID_ENGAGEMENT_MAPPING:
    'Un engagement du catalogue doit définir soit une action, soit des cibles.',
  INVALID_FICHES_CONFIG:
    'Les correspondances des actions Électrification sont incohérentes.',
} as const;

export type IndicateurReference = {
  location: string;
  identifiantReferentiel: string | null;
  unite: string | null;
  periodicite: string | null;
  annualTarget?: boolean;
};

type CatalogueError = keyof typeof electrificationCatalogueErrors;
type ElectrificationCatalogueIssue = {
  code: CatalogueError;
  location: string;
  message: string;
};

/** Invariants du catalogue partagé entre publication et résolution des imports. */
export class ElectrificationCatalogueRules {
  /** Les incohérences du catalogue sont des erreurs de configuration à l'import. */
  static asConfigurationIssues(
    issues: ElectrificationCatalogueIssue[]
  ): ElectrificationIssue[] {
    return issues.map((issue) => ({
      ...issue,
      kind: 'configuration-error' as const,
    }));
  }

  /** Les correspondances sont vérifiées lors de la résolution des références utilisées. */
  static isValid(config: ElectrificationConfig): boolean {
    const expectedEngagements = Object.values(
      ElectrificationEngagementCodeEnum
    );
    return (
      config.sousAxes !== null &&
      config.fiches.actions !== null &&
      config.fiches.indicateurs !== null &&
      config.engagements.length === expectedEngagements.length &&
      expectedEngagements.every((code) =>
        config.engagements.some((engagement) => engagement.code === code)
      ) &&
      this.validateStructure(config).length === 0 &&
      this.validateFiches(config).length === 0
    );
  }

  static validateFiches(
    config: ElectrificationConfig
  ): ElectrificationCatalogueIssue[] {
    const invalid = () => [this.issue('INVALID_FICHES_CONFIG', 'fiches')];
    const actions = config.fiches.actions ?? [];
    const indicateurs = config.fiches.indicateurs ?? [];
    if (
      new Set(actions.map((a) => a.code)).size !== actions.length ||
      new Set(indicateurs.map((i) => i.code)).size !== indicateurs.length
    )
      return invalid();
    for (const action of actions) {
      if (
        !config.axes.some((a) => a.numero === action.axeNumero) ||
        (action.sousAxeNumero !== null &&
          !config.sousAxes?.some(
            (a) =>
              a.numero === action.sousAxeNumero &&
              a.axeNumero === action.axeNumero
          )) ||
        new Set(action.sousActions.map((s) => s.code)).size !==
          action.sousActions.length ||
        new Set(action.indicateurCodes).size !==
          action.indicateurCodes.length ||
        action.indicateurCodes.some(
          (code) => !indicateurs.some((i) => i.code === code)
        )
      )
        return invalid();
    }
    return [];
  }

  static validateStructure(
    catalogue: ElectrificationConfig
  ): ElectrificationCatalogueIssue[] {
    const issues: ElectrificationCatalogueIssue[] = [];
    const axeNumeros = new Set<number>();
    catalogue.axes.forEach((axe, index) => {
      if (axeNumeros.has(axe.numero)) {
        issues.push(
          this.issue(
            'DUPLICATE_CATALOGUE_REFERENCE',
            `catalogue.axes[${index}]`
          )
        );
      }
      axeNumeros.add(axe.numero);
    });
    const sousAxeNumeros = new Set<string>();
    catalogue.sousAxes?.forEach((sousAxe, index) => {
      const location = `catalogue.sousAxes[${index}]`;
      if (sousAxeNumeros.has(sousAxe.numero)) {
        issues.push(this.issue('DUPLICATE_CATALOGUE_REFERENCE', location));
      }
      sousAxeNumeros.add(sousAxe.numero);
      if (!axeNumeros.has(sousAxe.axeNumero)) {
        issues.push(this.issue('INVALID_CATALOGUE_PARENT', location));
      }
    });
    const codes = new Set<string>();
    catalogue.engagements.forEach((engagement, index) => {
      const location = `catalogue.engagements[${index}]`;
      if (codes.has(engagement.code)) {
        issues.push(this.issue('DUPLICATE_CATALOGUE_REFERENCE', location));
      }
      codes.add(engagement.code);
      if (!axeNumeros.has(engagement.axeNumero)) {
        issues.push(this.issue('INVALID_CATALOGUE_PARENT', location));
      }
      if ((engagement.actionTitre !== null) === engagement.cibles.length > 0) {
        issues.push(this.issue('INVALID_ENGAGEMENT_MAPPING', location));
      }
      const cibleKeys = new Set<string>();
      const indicateurReferences = new Set<string>();
      engagement.cibles.forEach((cible, cibleIndex) => {
        if (
          cibleKeys.has(cible.key) ||
          (cible.identifiantReferentiel !== null &&
            indicateurReferences.has(cible.identifiantReferentiel))
        ) {
          issues.push(
            this.issue(
              'DUPLICATE_CATALOGUE_REFERENCE',
              `${location}.cibles[${cibleIndex}]`
            )
          );
        }
        cibleKeys.add(cible.key);
        if (cible.identifiantReferentiel !== null)
          indicateurReferences.add(cible.identifiantReferentiel);
      });
    });
    return issues;
  }

  static getValidatedIndicateurReferences(
    catalogue: ElectrificationConfig
  ): IndicateurReference[] {
    const references: IndicateurReference[] = catalogue.engagements.flatMap(
      (engagement, engagementIndex) =>
        engagement.cibles.flatMap((cible, cibleIndex) =>
          cible.validation === 'validated'
            ? [
                {
                  ...cible,
                  annualTarget: true,
                  location: `engagements[${engagementIndex}].cibles[${cibleIndex}]`,
                },
              ]
            : []
        )
    );
    catalogue.fiches.indicateurs?.forEach((indicateur, index) => {
      if (
        indicateur.type === 'quantitatif' &&
        indicateur.validation === 'validated'
      ) {
        references.push({
          ...indicateur,
          location: `fiches.indicateurs[${index}]`,
        });
      }
    });
    return references;
  }

  static validateIndicateurDefinitions(
    references: IndicateurReference[],
    definitions: {
      identifiantReferentiel: string | null;
      unite: string;
      periodicite: string;
    }[]
  ): ElectrificationDataIssue[] {
    const byReference = new Map(
      definitions.map((definition) => [
        definition.identifiantReferentiel,
        definition,
      ])
    );
    return references.flatMap(
      ({
        location,
        identifiantReferentiel,
        unite,
        periodicite,
        annualTarget,
      }) => {
        if (
          identifiantReferentiel === null ||
          unite === null ||
          periodicite === null
        ) {
          return [
            {
              location,
              message:
                'Une correspondance validée doit définir un indicateur TeT, une unité et une périodicité.',
            },
          ];
        }
        const definition = byReference.get(identifiantReferentiel);
        if (!definition)
          return [
            {
              location,
              message: `L'indicateur partagé "${identifiantReferentiel}" n'existe pas dans le catalogue TeT.`,
            },
          ];
        if (
          definition.unite !== unite ||
          definition.periodicite !== periodicite ||
          (annualTarget && periodicite !== 'annuelle')
        ) {
          return [
            {
              location,
              message: `L'unité ou la périodicité ne correspond pas à l'indicateur "${identifiantReferentiel}" ou à la cible annuelle attendue.`,
            },
          ];
        }
        return [];
      }
    );
  }

  private static issue(
    code: CatalogueError,
    location: string
  ): ElectrificationCatalogueIssue {
    return { code, location, message: electrificationCatalogueErrors[code] };
  }
}
