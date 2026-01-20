/**
 * Affiche un texte enrichi en lecture seule, avec un bouton "voir plus/moins"
 * si le texte est tronqué.
 */

import { cn } from '@tet/ui/utils/cn';
import { useState } from 'react';
import { Button } from '../Button';
import { RichTextEditor } from '../RichTextEditor';

type RichTextViewProps = {
  content: string | null;
  /** Hauteur maximum affichée avant que le contenu soit tronqué */
  maxHeight?: 'sm' | 'lg';
  /** Couleur du texte */
  textColor?: 'white' | 'grey' | 'primary';
  textSize?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
  /** Libellé du placeholder */
  placeholder?: string;
  /** Si true, l'éditeur prend la hauteur nécessaire pour afficher tout le contenu sans troncature */
  autoSize?: boolean;
  /** Classes supplémentaires appliquées au texte (contenu) */
  textClassName?: string;
};

export const RichTextView = ({
  content,
  maxHeight = 'lg',
  textColor = 'white',
  textSize = 'md',
  placeholder = 'Non renseignés',
  autoSize = false,
  textClassName,
}: RichTextViewProps) => {
  const [showLess, setShowLess] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  // Le bouton "voir plus/moins" doit être affiché quand le texte est tronqué
  // (pas assez de place en hauteur pour l'afficher) OU que le bouton 'voir plus"
  // à été cliqué et que donc le contenu n'est plus tronqué mais peut l'être
  // à nouveau.
  // Si autoSize est activé, on n'affiche jamais le bouton
  const showButton = !autoSize && (isTruncated || showLess);

  return (
    <div className="flex-auto flex-col">
      {content?.length ? (
        <RichTextEditor
          disabled
          className={cn(
            {
              'overflow-hidden': !autoSize && !showLess,
              'max-h-[23rem]': !autoSize && !showLess && maxHeight === 'lg',
              'max-h-[8rem]': !autoSize && !showLess && maxHeight === 'sm',
            },
            textClassName
          )}
          initialValue={content}
          setIsTruncated={autoSize ? undefined : setIsTruncated}
          contentStyle={{ size: textSize, color: textColor }}
        />
      ) : (
        <span
          className={cn('text-sm', {
            'text-grey-1': textColor === 'white',
            'text-grey-7': textColor === 'grey',
            'text-primary-9': textColor === 'primary',
          })}
        >
          {placeholder}
        </span>
      )}
      {showButton && (
        <Button
          variant="underlined"
          size="xs"
          className={cn('ml-auto', {
            'text-grey-2 border-grey-2': textColor === 'white',
            'text-primary-8 border-primary-8': textColor === 'grey',
            'text-primary-9 border-primary-9': textColor === 'primary',
          })}
          onClick={() => setShowLess((prevState) => !prevState)}
        >
          {showLess ? 'Voir moins' : 'Voir plus'}
        </Button>
      )}
    </div>
  );
};
