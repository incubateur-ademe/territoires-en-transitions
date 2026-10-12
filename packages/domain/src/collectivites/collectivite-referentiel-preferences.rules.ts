import type {
  CollectiviteReferentielPreferenceId,
  CollectiviteReferentielPreferences,
  ReferentielDisplayMap,
  ReferentielMode,
  ReferentielPreference,
} from './collectivite-preferences.schema';
import { getReferentielDisplayMap } from './collectivite-preferences.schema';

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
 * - `engage` : activité suffisante pour que le référentiel reste en écriture.
 */
export const niveauxRemplissage = ['vide', 'superficiel', 'engage'] as const;

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
  return niveauRemplissage === 'engage'
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

  const collectiviteEngaged = input.cae === 'engage' || input.eci === 'engage';

  return {
    cae: caeEciPreferenceFromNiveauRemplissage(input.cae),
    eci: caeEciPreferenceFromNiveauRemplissage(input.eci),
    te: preferenceFromDisplay(true, collectiviteEngaged ? 'readonly' : 'write'),
  };
}

export function referentielPreferencesFromDisplayMap(
  display: ReferentielDisplayMap,
  existing?: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  const derived = deriveReferentielPreferences(
    {
      cae: display.cae ? 'engage' : 'vide',
      eci: display.eci ? 'engage' : 'vide',
    },
    existing
  );

  if (existing?.te.populatedFromCaeEci) {
    return derived;
  }

  return {
    ...derived,
    te: preferenceFromDisplay(
      display.te,
      derived.te.mode as Exclude<ReferentielMode, 'archived'>
    ),
  };
}

export function toggleReferentielDisplayPreference(
  referentielId: CollectiviteReferentielPreferenceId,
  referentiels: CollectiviteReferentielPreferences
): CollectiviteReferentielPreferences {
  if (referentiels.te.populatedFromCaeEci) {
    return referentiels;
  }

  // TE et les référentiels CAE/ECI archivés gardent leur mode : on ne change
  // que leur présence dans la navigation
  const target = referentiels[referentielId];
  if (referentielId === 'te' || target.mode === 'archived') {
    return {
      ...referentiels,
      [referentielId]: { ...target, display: !target.display },
    };
  }

  // masquer un référentiel CAE/ECI en écriture l'archive, et recalcule le mode
  // de TE. Un référentiel archivé mais visible ne compte pas comme engagé : il
  // ne doit pas repasser en écriture quand on bascule l'affichage d'un autre
  const display = getReferentielDisplayMap(referentiels);
  const isArchived = (id: 'cae' | 'eci') =>
    id !== referentielId && referentiels[id].mode === 'archived';
  const derived = referentielPreferencesFromDisplayMap(
    {
      cae: display.cae && !isArchived('cae'),
      eci: display.eci && !isArchived('eci'),
      te: true,
      [referentielId]: !display[referentielId],
    },
    referentiels
  );

  return {
    // seul le mode de TE est recalculé, sa présence dans la navigation est conservée
    te: { ...derived.te, display: display.te },
    cae: isArchived('cae') ? referentiels.cae : derived.cae,
    eci: isArchived('eci') ? referentiels.eci : derived.eci,
  };
}
