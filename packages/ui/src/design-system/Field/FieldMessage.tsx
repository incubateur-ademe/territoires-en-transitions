import classNames from 'classnames';
import { JSX } from 'react';

import { Icon } from '../Icon';
import { FieldState } from './Field';

export const stateToTextColor: Record<FieldState, string> = {
  info: 'text-info-1',
  error: 'text-error-1',
  success: 'text-success-1',
  warning: 'text-warning-1',
  default: 'text-grey-7',
  disabled: 'text-grey-6',
};

export const stateToIcon: Record<FieldState, string> = {
  info: 'information-fill',
  error: 'spam-fill',
  success: 'checkbox-circle-fill',
  warning: 'alert-fill',
  default: '',
  disabled: '',
};

/**
 * Affiche un message additionnel au-dessous d'un champ de formulaire.
 */
export type FieldMessageProps = {
  /** État */
  state?: FieldState;
  /** Message d'état affiché en dessous du champ */
  message?: string | JSX.Element;
  /** Pour surcharger les styles du container du message */
  messageClassName?: string;
  /** Id pour les tests */
  'data-test'?: string;
};

export const FieldMessage = ({
  message,
  state = 'default',
  messageClassName,
  'data-test': dataTest,
}: FieldMessageProps) => {
  return (
    message !== undefined && (
      <div
        data-test={dataTest}
        className={classNames(
          'flex items-start gap-1',
          stateToTextColor[state],
          messageClassName
        )}
      >
        {state !== 'disabled' && state !== 'default' && (
          <Icon icon={stateToIcon[state]} size="sm" className="mr-1" />
        )}
        {typeof message === 'string' ? (
          <span className="text-xs">{message}</span>
        ) : (
          message
        )}
      </div>
    )
  );
};
