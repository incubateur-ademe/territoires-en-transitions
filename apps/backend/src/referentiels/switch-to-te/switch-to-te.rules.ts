import type {
  CollectiviteReferentielPreferences,
  PopulatedFromCaeEci,
  ReferentielPreference,
} from '@tet/domain/collectivites';
import type {
  ParcoursLabellisationStatus,
  ReferentielId,
} from '@tet/domain/referentiels';

/**
 * Construit les préférences post-bascule :
 * - refs CAE/ECI en `write` → `{ mode: archived, display: false }`
 * - refs déjà `archived` → inchangées
 * - `te` → `{ mode: write, display: true, populatedFromCaeEci: populated }`
 */
export function buildPostSwitchPreferences(
  prefs: CollectiviteReferentielPreferences,
  populated: PopulatedFromCaeEci
): CollectiviteReferentielPreferences {
  const archiveIfWrite = (p: ReferentielPreference): ReferentielPreference =>
    p.mode === 'write' ? { mode: 'archived', display: false } : p;

  return {
    cae: archiveIfWrite(prefs.cae),
    eci: archiveIfWrite(prefs.eci),
    te: { mode: 'write', display: true, populatedFromCaeEci: populated },
  };
}

export function canSwitchToTe(
  prefs: CollectiviteReferentielPreferences
): boolean {
  if (prefs.te.populatedFromCaeEci) return false;
  if (prefs.te.mode !== 'readonly') return false;
  // proxy engagement : au moins une source encore en écriture
  return prefs.cae.mode === 'write' || prefs.eci.mode === 'write';
}

/**
 * Blocage empêchant la bascule vers TE.
 * `referentielId` permettra à la PR19 (UI) de construire des messages
 * détaillés par référentiel.
 */
export type SwitchToTeBlocker =
  | { type: 'COT_ACTIVE' }
  | { type: 'AUDIT_IN_PROGRESS'; referentiel: ReferentielId }
  | { type: 'AUDIT_REQUEST_IN_PROGRESS'; referentiel: ReferentielId };

/**
 * Détermine les blocages à la bascule vers TE à partir de l'état fourni.
 *
 * Ordre des blocages : COT d'abord (niveau collectivité), puis par référentiel
 * dans l'ordre fourni (`cae` avant `eci`). Un audit en cours prime sur une
 * simple demande envoyée pour un même référentiel.
 */
export function getSwitchToTeBlockers(input: {
  cotActif: boolean;
  referentielsEnWrite: {
    referentiel: ReferentielId;
    status: ParcoursLabellisationStatus;
  }[];
}): SwitchToTeBlocker[] {
  const blockers: SwitchToTeBlocker[] = [];

  if (input.cotActif) {
    blockers.push({ type: 'COT_ACTIVE' });
  }

  for (const { referentiel, status } of input.referentielsEnWrite) {
    // audit en cours prime sur demande envoyée
    if (status === 'audit_en_cours') {
      blockers.push({ type: 'AUDIT_IN_PROGRESS', referentiel });
    } else if (status === 'demande_envoyee') {
      blockers.push({ type: 'AUDIT_REQUEST_IN_PROGRESS', referentiel });
    }
    // non_demandee et audit_valide ne sont pas bloquants
  }

  return blockers;
}
