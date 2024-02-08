import {Ref, forwardRef} from 'react';
import {FieldError} from 'react-hook-form';
import {Field, FieldMessageProps} from '@design-system/Field';
import {Input} from '@design-system/Input';
import {LoginPropsWithState} from './type';

/**
 * Champ de saisi de l'email
 *
 * Affiche le message approprié (info ou erreur).
 */
export const InputEmail = forwardRef(
  (
    {
      loginState,
      infoMessage,
    }: {
      loginState: LoginPropsWithState['loginState'];
      infoMessage?: string;
    },
    ref?: Ref<HTMLInputElement>
  ) => {
    const {
      emailProps,
      form: {
        formState: {errors},
      },
    } = loginState;
    const messageProps: FieldMessageProps = getMessageProps(
      infoMessage,
      errors?.email
    );

    return (
      <Field
        className="md:col-span-2"
        title="Email de connexion"
        {...messageProps}
        htmlFor="email"
      >
        <Input
          id="email"
          type="text"
          autoComplete="on"
          state={errors?.email ? 'error' : undefined}
          ref={ref}
          {...emailProps}
        />
      </Field>
    );
  }
);
const getMessageProps = (
  info: string | undefined,
  error: FieldError | undefined
) => {
  if (error) {
    return {message: error.message, state: 'error'} as FieldMessageProps;
  }
  if (info) {
    return {message: info, state: 'info'} as FieldMessageProps;
  }
  return {};
};
