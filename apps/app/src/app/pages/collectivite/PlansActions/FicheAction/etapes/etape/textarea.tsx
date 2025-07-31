import { forwardRef, Ref, useState } from 'react';
import classNames from 'classnames';

import { AutoResizedTextarea, TextareaProps } from '@/ui';
import { RouterInput } from '@/api/utils/trpc/client';

type EtapeUpsert = RouterInput['plans']['fiches']['etapes']['upsert'];

type Props = Pick<EtapeUpsert, 'nom' | 'realise'> &
  Pick<TextareaProps, 'className' | 'placeholder' | 'disabled'> & {
    /**
     * Méthode utilisée pour exécuter l'update du titre de l'étape.
     * Reçoit le nouveau titre en paramètre (`trim` appliqué).
     */
    onBlur: (newTitle: string) => void;
  };

/**
 * Wrapper de `AutoResizedTextarea` du design-system.
 * Utilisé pour l'affichage, la modification et la création du titre d'une étape.
 */
export const Textarea = forwardRef(
  (
    { nom, realise, onBlur, className, placeholder, disabled }: Props,
    ref?: Ref<HTMLTextAreaElement>
  ) => {
    const initialNom = nom ?? '';

    const [value, setValue] = useState(initialNom);

    return (
      <AutoResizedTextarea
        ref={ref}
        containerClassname="w-full border-none bg-transparent resize-none"
        className={classNames(
          'ml-1 !p-0 font-medium !text-base text-grey-8 placeholder:!font-normal placeholder:!text-base placeholder:!italic',
          {
            '!text-grey-8': disabled && !realise,
            'line-through !text-grey-6': realise,
          },
          className
        )}
        value={value}
        onChange={(evt) => setValue(evt.currentTarget.value)}
        onKeyDown={(evt) => {
          if (['Enter', 'Escape', 'Tab'].includes(evt.key)) {
            evt.preventDefault();
            evt.currentTarget.blur();
          }
        }}
        onBlur={() => {
          const trimedValue = value.trim();
          onBlur(trimedValue);
          // Cas pour la création d'une étape.
          // On veut réinitialiser le champ après l'ajout de l'étape
          if (initialNom.length === 0) return setValue('');
          // Cas d'une étape existante avec un titre.
          // si le nouveau titre est vide, on remet l'ancien titre
          if (trimedValue.length === 0) return setValue(initialNom);
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
