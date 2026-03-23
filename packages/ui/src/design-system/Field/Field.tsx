import { cn } from '../../utils/cn';
import { FieldMessage, FieldMessageProps } from './FieldMessage';

export type FieldState =
  | 'default'
  | 'info'
  | 'error'
  | 'success'
  | 'warning'
  | 'disabled';

export type FieldProps = {
  /** Id */
  fieldId?: string;
  /** Titre */
  title?: string;
  /** Enfant: input, select... */
  children: React.ReactNode;
  /** Pour surcharger les styles du container */
  className?: string;
  /** Pour surcharger les styles du titre */
  titleClassName?: string;
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
  titleClassName,
  hint,
  htmlFor,
  state = 'default',
  message,
  children,
  small,
}: FieldProps) => {
  return (
    <div
      id={fieldId}
      className={cn(
        'flex-grow flex flex-col',
        {
          'gap-2': !small,
          'gap-1': small,
        },
        className
      )}
    >
      {(!!title?.trim() || !!hint?.trim()) && (
        <label htmlFor={htmlFor} className="ml-0 mb-0">
          {/** Title */}
          {title !== undefined && (
            <div
              className={cn(
                'font-medium text-grey-8',
                {
                  'text-grey-5': state === 'disabled',
                  'text-sm': small,
                },
                titleClassName
              )}
            >
              {title}
            </div>
          )}
          {/** Hint */}
          {hint !== undefined && (
            <span
              className={cn('block mt-2 text-xs text-grey-7', {
                'text-grey-5': state === 'disabled',
              })}
            >
              {hint}
            </span>
          )}
        </label>
      )}
      {children}
      <FieldMessage state={state} message={message} />
    </div>
  );
};
