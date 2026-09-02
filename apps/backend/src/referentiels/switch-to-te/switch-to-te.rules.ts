import type {
  CollectiviteReferentielPreferences,
  PopulatedFromCaeEci,
  ReferentielPreference,
} from '@tet/domain/collectivites';
import type {
  ParcoursLabellisationStatus,
  ReferentielId,
} from '@tet/domain/referentiels';

/** Un référentiel a été "engagé" si son activité (statuts / commentaires)
 * atteint le seuil `shouldDisplayReferentielByCriteria`. Ce n'est PAS équivalent
 * à `mode === 'write'` : une collectivité sur laquelle le reset des préférences
 * n'a pas encore tourné garde CAE et ECI en `write` par défaut, même vides. */
export type ReferentielEngagement = { cae: boolean; eci: boolean };

/**
 * Construit les préférences post-bascule :
 * - refs CAE/ECI en `write` :
 *   - engagées (contenaient des données) → `{ mode: archived, display: true }` :
 *     archivées mais conservées dans la nav en lecture seule, libellé "(archivé)"
 *   - non engagées → `{ mode: archived, display: false }` : archivées et hors nav
 * - refs déjà `archived` → inchangées
 * - `te` → `{ mode: write, display: true, populatedFromCaeEci: populated }`
 */
export function buildPostSwitchPreferences(
  prefs: CollectiviteReferentielPreferences,
  populated: PopulatedFromCaeEci,
  engagement: ReferentielEngagement
): CollectiviteReferentielPreferences {
  const archiveIfWrite = (
    p: ReferentielPreference,
    engaged: boolean
  ): ReferentielPreference =>
    p.mode === 'write' ? { mode: 'archived', display: engaged } : p;

  return {
    cae: archiveIfWrite(prefs.cae, engagement.cae),
    eci: archiveIfWrite(prefs.eci, engagement.eci),
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
  | { type: 'COLLECTIVITE_IS_SYNDICAT' }
  | { type: 'AUDIT_IN_PROGRESS'; referentiel: ReferentielId }
  | { type: 'AUDIT_REQUEST_IN_PROGRESS'; referentiel: ReferentielId };

/**
 * Détermine les blocages à la bascule vers TE à partir de l'état fourni.
 *
 * Ordre des blocages : syndicat puis COT (niveau collectivité), puis par
 * référentiel dans l'ordre fourni (`cae` avant `eci`). Un audit en cours prime
 * sur une simple demande envoyée pour un même référentiel.
 */
export function getSwitchToTeBlockers(input: {
  cotActif: boolean;
  isSyndicat: boolean;
  referentielsEnWrite: {
    referentiel: ReferentielId;
    status: ParcoursLabellisationStatus;
  }[];
}): SwitchToTeBlocker[] {
  const blockers: SwitchToTeBlocker[] = [];

  if (input.isSyndicat) {
    blockers.push({ type: 'COLLECTIVITE_IS_SYNDICAT' });
  }

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
