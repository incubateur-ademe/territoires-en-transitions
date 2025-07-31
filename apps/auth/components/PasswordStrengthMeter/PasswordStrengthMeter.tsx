import {ZxcvbnResult} from '@zxcvbn-ts/core';

// libellés et couleurs en fonction du niveau de robustesse du mdp
const DEFAULT_LABEL = 'Faible';
const labelsByScore = [
  DEFAULT_LABEL,
  DEFAULT_LABEL,
  'Passable',
  'Bon',
  'Robuste',
];

const DEFAULT_BG_COLOR = 'bg-error-1';
const bgColorsByScore = [
  DEFAULT_BG_COLOR,
  DEFAULT_BG_COLOR,
  'bg-warning-1',
  'bg-warning-3',
  'bg-success',
];

const DEFAULT_TEXT_COLOR = 'text-error-1';
const textColorsByScore = [
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_COLOR,
  'text-warning-1',
  'text-grey-7',
  'text-success',
];

/**
 * Affiche un indicateur de robustesse du mot de passe
 */
export const PasswordStrengthMeter = ({
  strength,
  className,
}: {
  /** Résultat du contrôle de robustesse tel que fourni par zxcvbn */
  strength: ZxcvbnResult;
  /** Styles appliqués au container */
  className?: string;
}) => {
  if (!strength) return;
  
  const {score, feedback} = strength;
  const {warning, suggestions} = feedback || {};
  const label = labelsByScore[score] || DEFAULT_LABEL;
  const bgColor = bgColorsByScore[score] || DEFAULT_BG_COLOR;
  const textColor = textColorsByScore[score] || DEFAULT_TEXT_COLOR;

  return (
    <section className={className}>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${bgColor} h-2.5 rounded-full`}
          style={{width: `${score * 25}%`}}
        ></div>
      </div>
      <label className={`${textColor} block text-sm`}>
        {score ? label : ''}
      </label>
      {warning ? <label>{warning}</label> : null}
      {suggestions?.length ? (
        <ul className="mt-2 ml-4 text-sm list-disc">
          {suggestions.map(s => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
