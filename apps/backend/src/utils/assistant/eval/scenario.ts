/**
 * Scénario d'évaluation de l'assistant. On juge ce que l'agent fait (outils
 * appelés, arguments, données absentes de la réponse), pas la prose. Format
 * inspiré du harnais de l'assistant de Planck (décisions 49 à 61).
 *
 * `say` et les valeurs attendues peuvent citer la fixture du run par
 * `{collectivite.id}`, `{collectivite.nom}`, `{plan.nom}`, `{membre.email}`.
 */
export type FixtureRef =
  | 'collectivite.id'
  | 'collectivite.nom'
  | 'plan.nom'
  | 'membre.email'
  | 'membre.nom';

export type Matcher =
  | string
  | number
  | boolean
  | { ref: FixtureRef }
  | { oneOf: (string | number)[] }
  | { matches: string }
  | { any: true };

export type ToolExpectation = {
  name: string;
  args?: Record<string, Matcher>;
};

export type Viewer = 'support-super-admin' | 'support-sans-mode';

export type Scenario = {
  id: string;
  /** `metier` (fixtures locales), `analytique` (base de l'équipe data),
   * `posthog`, `refus`, `esquisse`. */
  tags: string[];
  viewer?: Viewer;
  mode?: 'analyse' | 'esquisse';
  esquisse?: { sujet: string; appetit?: string };
  say: string;
  expect: {
    /** Chaque attente doit être satisfaite par au moins un appel. */
    tools?: ToolExpectation[];
    /** Au moins un de ces outils doit être appelé. */
    anyTool?: string[];
    answer?: {
      /** Chaque entrée : une chaîne, ou plusieurs dont une suffit. */
      contains?: (string | { ref: FixtureRef } | string[])[];
      notContains?: string[];
    };
  };
  maxModelCalls?: number;
  /** Réussites exigées sur `repeat` exécutions ; défaut : toutes. */
  tolerance?: { pass: number };
};

export const defineScenario = (scenario: Scenario): Scenario => scenario;
