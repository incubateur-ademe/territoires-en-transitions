import classNames from 'classnames';

import {FieldMessage, FieldMessageProps} from './FieldMessage';

export type FieldState =
  | 'default'
  | 'info'
  | 'error'
  | 'success'
  | 'warning'
  | 'disabled';

type Props = {
  /** Id */
  fieldId?: string;
  /** Titre */
  title: string;
  /** Enfant: input, select... */
  children: React.ReactNode;
  /** Pour surcharger les styles du container */
  className?: string;
  /** Complément d'informations */
  hint?: string;
  /** Pour lier le libellé et le champ qu'il contient */
  htmlFor?: string;
  /** Réduit la taille du titre */
  small?: boolean;
} & FieldMessageProps;

/** Wrapper pour élément de formulaire donnant des informations et un état */
export const Field = ({
  fieldId,
  title,
  className,
  hint,
  htmlFor,
  state = 'default',
  message,
  children,
  small,
}: Props) => {
  return (
    <div
      id={fieldId}
      className={classNames(`flex-grow flex flex-col gap-3`, className)}
    >
      <label htmlFor={htmlFor} className="ml-0 mb-0">
        {/** Title */}
        <div
          className={classNames('font-medium text-grey-8', {
            'text-grey-5': state === 'disabled',
            'text-sm': small,
          })}
        >
          {title}
        </div>
        {/** Hint */}
        {hint !== undefined && (
          <span
            className={classNames('block mt-2 text-xs text-grey-7', {
              'text-grey-5': state === 'disabled',
            })}
          >
            {hint}
          </span>
        )}
      </label>
      {children}
      <FieldMessage state={state} message={message} />
    </div>
  );
};
