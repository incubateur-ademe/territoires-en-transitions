/**
 * Affiche un texte enrichi en lecture seule, avec un bouton "voir plus/moins"
 * si le texte est tronqué.
 */

import { Button, RichTextEditor } from '@/ui';
import { cn } from '@/ui/utils/cn';
import { useState } from 'react';

type RichTextViewProps = {
  content: string | null;
  /** Hauteur maximum affichée avant que le contenu soit tronqué */
  maxHeight?: 'sm' | 'lg';
  /** Couleur du texte */
  textColor?: 'white' | 'grey';
};

export const RichTextView = ({
  content,
  maxHeight = 'lg',
  textColor = 'white',
}: RichTextViewProps) => {
  const [showLess, setShowLess] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  return (
    <div className="flex-auto flex-col">
      {content?.length ? (
        <RichTextEditor
          disabled
          className={cn('!bg-transparent border-none !p-0', {
            'overflow-hidden': !showLess,
            'max-h-[23rem]': !showLess && maxHeight === 'lg',
            'max-h-[8rem]': !showLess && maxHeight === 'sm',
            '!text-grey-1': textColor === 'white',
            '!text-grey-8': textColor === 'grey',
          })}
          initialValue={content}
          setIsTruncated={setIsTruncated}
        />
      ) : (
        'Non renseigné'
      )}
      {(isTruncated || showLess) && (
        <Button
          variant="underlined"
          size="xs"
          className={cn('ml-auto', {
            '!text-grey-2 !border-grey-2': textColor === 'white',
            '!text-primary-8 !border-primary-8': textColor === 'grey',
          })}
          onClick={() => setShowLess((prevState) => !prevState)}
        >
          {showLess ? 'Voir moins' : 'Voir plus'}
        </Button>
      )}
    </div>
  );
};
