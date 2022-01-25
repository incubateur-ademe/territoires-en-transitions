import React from 'react';

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
  'bg-green-500',
];

const DEFAULT_TEXT_COLOR = 'text-red-500';
const textColorsByScore = [
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_COLOR,
  'text-yellow-500',
  'text-gray-500',
  'text-green-500',
];

/**
 * Affiche un indicateur de robustesse du mot de passe
 */
export const PasswordStrengthMeter = ({
  score,
  className,
}: {
  /** Score tel que fourni par zxcvbn */
  score: number;
  /** Styles appliqués au container */
  className?: string;
}) => {
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
    </section>
  );
};
