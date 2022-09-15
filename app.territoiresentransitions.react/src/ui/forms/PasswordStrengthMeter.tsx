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

const DEFAULT_BG_COLOR = 'bg-red-500';
const bgColorsByScore = [
  DEFAULT_BG_COLOR,
  DEFAULT_BG_COLOR,
  'bg-yellow-500',
  'bg-yellow-300',
  'bg-emerald-500',
];

const DEFAULT_TEXT_COLOR = 'text-red-500';
const textColorsByScore = [
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_COLOR,
  'text-yellow-500',
  'text-gray-500',
  'text-emerald-500',
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
