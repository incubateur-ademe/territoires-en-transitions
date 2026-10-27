import { cn } from '@tet/ui';

/**
 * Proposition : nouveau composant
 * Besoin : une barre de progression pleine largeur (avancement, budget engagé,
 * temps écoulé), avec une teinte claire ou foncée ; le design system n'a pas de
 * barre de progression.
 */
export const ProgressBar = ({
  value,
  label,
  tone = 'primary',
}: {
  /** Valeur de 0 à 1. */
  value: number;
  /** Libellé accessible (lu par les lecteurs d'écran). */
  label: string;
  tone?: 'primary' | 'dark';
}) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value * 100)}
    className={cn(
      'h-2 w-full rounded-full',
      tone === 'primary' ? 'bg-primary-2' : 'bg-grey-3',
    )}
  >
    <div
      className={cn(
        'h-2 rounded-full',
        tone === 'primary' ? 'bg-primary-7' : 'bg-primary-9',
      )}
      style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
    />
  </div>
);
