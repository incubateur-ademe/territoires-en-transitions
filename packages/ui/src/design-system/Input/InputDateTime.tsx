import { DateTime } from 'luxon';
import { ForwardedRef, forwardRef } from 'react';
import { InputDate, InputDateProps } from './InputDate';

export interface InputDateTimeProps extends InputDateProps {
  onDateTimeChange?: (
    value: string | null,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

const getDateValue = (value: string | undefined): string => {
  if (!value) {
    return '';
  }
  // Take only the date part
  return value.length === 10
    ? value
    : DateTime.fromISO(value).setZone('Europe/Paris').toISODate() || '';
};

/**
 * Affiche un champ de saisie date mais permet d'avoir des valeurs ISO date time en entrée et sortie
 */
export const InputDateTime = forwardRef(
  (
    { value, onChange, onDateTimeChange, ...props }: InputDateTimeProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <InputDate
        ref={ref}
        {...props}
        value={getDateValue(value)}
        onChange={(e) => {
          onChange?.(e);

          if (e.currentTarget.value) {
            const dateStringValue =
              DateTime.fromISO(e.currentTarget.value, {
                zone: 'Europe/Paris',
              })
                .toJSDate()
                .toISOString() || e.currentTarget.value;

            onDateTimeChange?.(dateStringValue, e);
          } else {
            onDateTimeChange?.(null, e);
          }
        }}
        {...props}
      />
    );
  }
);
InputDateTime.displayName = 'InputDateTime';