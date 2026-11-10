import type { TrackedEventPropertyValue } from '@tet/backend/utils/tracking/event-tracker.interface';
import type { CollectiviteType } from '@tet/domain/collectivites';
import type {
  DemarchePcaet,
  PcaetPerimetreSaisine,
} from '@tet/domain/demarches';
import { objectToSnake } from 'ts-case-convert';
import type { DemarchePcaetActeur } from './demarche-pcaet-tracking.constants';

/**
 * Ce que l'événement dit de la démarche. Seuls l'identité et le statut sont
 * exigés : les opérations qui ne relisent que la référence (`DemarchePcaetRef`)
 * n'ont pas l'obligation ni le drapeau SCoT-AEC sous la main, et l'événement
 * part sans plutôt que de coûter une lecture.
 */
export type DemarchePcaetTrackingSubject = Pick<
  DemarchePcaet,
  'id' | 'collectiviteId' | 'status'
> &
  Partial<
    Pick<DemarchePcaet, 'obligation' | 'transmittedOffPlatform' | 'isScotAec'>
  >;

export type DemarchePcaetTrackingContext = {
  acteur: DemarchePcaetActeur;
  /** Type du service qui agit, quand l'acteur est un instructeur. */
  instructeurType?: CollectiviteType;
  /** Nature de la saisine de ce service sur le dossier. */
  perimetreSaisine?: PcaetPerimetreSaisine;
};

export type DemarchePcaetEventProperties = Record<
  string,
  TrackedEventPropertyValue
>;

/**
 * Les propriétés communes à tout événement `demarches:pcaet:*`, celles qui
 * permettent de croiser les événements entre eux : par démarche, par statut,
 * par obligation, par acteur.
 *
 * Le type, la région ou la population de la collectivité n'y sont pas : ils
 * viennent du groupe PostHog `collectivite`, que l'appelant pose sur
 * l'événement.
 *
 * Les propriétés propres à l'événement s'écrivent en camelCase et sortent en
 * snake_case, comme celles du front (`useEventTracker`). Elles ne peuvent pas
 * écraser les propriétés communes.
 */
export const buildDemarchePcaetEventProperties = (
  subject: DemarchePcaetTrackingSubject,
  context: DemarchePcaetTrackingContext,
  properties: Record<string, TrackedEventPropertyValue> = {}
): DemarchePcaetEventProperties => ({
  ...(objectToSnake(properties) as DemarchePcaetEventProperties),
  demarche_id: subject.id,
  collectivite_id: subject.collectiviteId,
  demarche_status: subject.status,
  demarche_obligation: subject.obligation,
  transmitted_off_platform: subject.transmittedOffPlatform,
  is_scot_aec: subject.isScotAec,
  acteur: context.acteur,
  instructeur_type: context.instructeurType,
  perimetre_saisine: context.perimetreSaisine,
});

/**
 * L'identifiant PostHog de l'événement. Une bascule sans acteur (cron,
 * transition constatée) n'est imputée à personne : elle est rattachée à la
 * démarche, et ne doit pas fabriquer de profil de personne.
 */
export const getDemarchePcaetDistinctId = (
  subject: Pick<DemarchePcaetTrackingSubject, 'id'>,
  userId: string | null | undefined
): { distinctId: string; isPerson: boolean } =>
  userId
    ? { distinctId: userId, isPerson: true }
    : { distinctId: `demarche:${subject.id}`, isPerson: false };

/** Nombre de jours pleins entre deux instants ISO ; nul si l'un manque. */
export const daysBetween = (
  from: string | null | undefined,
  to: string | Date = new Date()
): number | null => {
  if (!from) return null;
  const start = new Date(from).getTime();
  const end = (typeof to === 'string' ? new Date(to) : to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.floor((end - start) / 86_400_000);
};
