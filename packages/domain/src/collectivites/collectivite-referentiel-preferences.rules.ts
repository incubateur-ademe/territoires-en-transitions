import type {
  CollectiviteReferentielPreferences,
  ReferentielMode,
  ReferentielPreference,
} from './collectivite-preferences.schema';

export function preferenceFromDisplay(
  display: boolean,
  visibleMode: Exclude<ReferentielMode, 'archived'>
): ReferentielPreference {
  return display
    ? { display: true, mode: visibleMode }
    : { display: false, mode: 'archived' };
}

/**
 * Niveau de remplissage d'un référentiel CAE ou ECI par une collectivité :
 * - `vide` : aucun statut ni texte renseigné ;
 * - `superficiel` : des données, mais trop peu pour que le référentiel soit engagé ;
 * - `actif` : trop peu de données pour être engagé, mais une saisie récente :
 *   le référentiel reste en écriture sans rendre la collectivité éligible à la
 *   bascule vers TE ;
 * - `engage` : activité suffisante pour que le référentiel reste en écriture.
 */
export const niveauxRemplissage = [
  'vide',
  'superficiel',
  'actif',
  'engage',
] as const;

export type NiveauRemplissage = (typeof niveauxRemplissage)[number];

/** Un référentiel archivé reste dans la navigation dès qu'il contient des données */
export function isReferentielArchiveDisplayed(
  niveauRemplissage: NiveauRemplissage
): boolean {
  return niveauRemplissage !== 'vide';
}

function caeEciPreferenceFromNiveauRemplissage(
  niveauRemplissage: NiveauRemplissage
): ReferentielPreference {
  return niveauRemplissage === 'engage' || niveauRemplissage === 'actif'
    ? { display: true, mode: 'write' }
    : {
        display: isReferentielArchiveDisplayed(niveauRemplissage),
        mode: 'archived',
      };
}

export type DeriveReferentielPreferencesInput = {
  cae: NiveauRemplissage;
  eci: NiveauRemplissage;
  /** COT actif, audit en cours ou demande d'audit envoyée : la bascule est
   * bloquée, rien n'est archivé (prime sur `isSyndicat` et `isDrom`) */
  hasSwitchToTeBlocker?: boolean;
  /** syndicat : non éligible à TE, reste sur ECI (prime sur `isDrom`) */
  isSyndicat?: boolean;
  /** DROM : pas encore éligible à TE, reste sur CAE et ECI */
  isDrom?: boolean;
};

export function deriveReferentielPreferences(
  input: DeriveReferentielPreferencesInput,
  existing?: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  if (existing?.te.populatedFromCaeEci) {
    return existing;
  }

  const { hasSwitchToTeBlocker, isSyndicat, isDrom } = input;

  // bascule bloquée (COT, audit ou demande d'audit) : un référentiel archivé
  // passe en lecture seule, il ne pourrait plus être complété ni audité d'ici
  // la levée du blocage. On n'archive donc rien, quel que soit le remplissage
  if (hasSwitchToTeBlocker) {
    return {
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };
  }

  // collectivités non éligibles à la bascule : ECI et TE forcés, indépendants
  // du niveau de remplissage. Le CAE d'un syndicat n'est archivé que s'il
  // n'est pas engagé
  if (isSyndicat) {
    return {
      cae: caeEciPreferenceFromNiveauRemplissage(input.cae),
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };
  }

  if (isDrom) {
    return {
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };
  }

  // un référentiel `actif` reste en écriture mais n'engage pas la collectivité :
  // TE reste en écriture, la bascule n'est donc pas proposée
  const collectiviteEngaged = input.cae === 'engage' || input.eci === 'engage';

  return {
    cae: caeEciPreferenceFromNiveauRemplissage(input.cae),
    eci: caeEciPreferenceFromNiveauRemplissage(input.eci),
    te: preferenceFromDisplay(true, collectiviteEngaged ? 'readonly' : 'write'),
  };
}
