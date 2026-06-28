import { FieldMessage } from '@tet/ui';
import { ZxcvbnResult } from '@zxcvbn-ts/core';

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
  errorMessage,
}: {
  /** Résultat du contrôle de robustesse tel que fourni par zxcvbn */
  strength: ZxcvbnResult;
  /** Styles appliqués au container */
  className?: string;
  errorMessage?: string;
}) => {
  if (!strength) return;

  const { score, feedback } = strength;
  const { suggestions } = feedback || {};
  const label: string = labelsByScore[score] || DEFAULT_LABEL;
  const bgColor: string = bgColorsByScore[score] || DEFAULT_BG_COLOR;
  const textColor: string = textColorsByScore[score] || DEFAULT_TEXT_COLOR;

  // le label Bon porte à confusion, on le remplace par Moyen et on change la couleur du texte et du fond
  const { modifiedLabel, modifiedBgColor, modifiedTextColor } =
    label === 'Passable' || label === 'Bon'
      ? {
          modifiedLabel: 'Moyen',
          modifiedBgColor: 'bg-warning-1',
          modifiedTextColor: 'text-warning-1',
        }
      : {
          modifiedLabel: label,
          modifiedBgColor: bgColor,
          modifiedTextColor: textColor,
        };

  return (
    <section className={className}>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${modifiedBgColor} h-2.5 rounded-full`}
          style={{ width: `${score * 25}%` }}
        ></div>
      </div>
      <label className={`${modifiedTextColor} block text-sm`}>
        {score ? modifiedLabel : ''}
      </label>

      {suggestions?.length
        ? suggestions.map((s, index) => (
            <div key={index} className="mt-2">
              <FieldMessage state="warning" message={s} />
            </div>
          ))
        : null}
      {errorMessage && (
        <div className="mt-2">
          <FieldMessage state="error" message={errorMessage} />
        </div>
      )}
    </section>
  );
};
