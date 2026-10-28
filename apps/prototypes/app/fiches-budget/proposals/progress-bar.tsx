/**
 * Proposition : nouveau composant
 * Besoin : montrer la part consommée du budget d'une fiche, en ligne, sans
 * libellé ; le design system n'a pas de barre de progression.
 */
export const ProgressBar = ({
  value,
  label,
}: {
  /** Valeur de 0 à 1. */
  value: number;
  /** Libellé accessible (lu par les lecteurs d'écran). */
  label: string;
}) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value * 100)}
    className="h-2 w-40 rounded-full bg-primary-2"
  >
    <div
      className="h-2 rounded-full bg-primary-7"
      style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
    />
  </div>
);
