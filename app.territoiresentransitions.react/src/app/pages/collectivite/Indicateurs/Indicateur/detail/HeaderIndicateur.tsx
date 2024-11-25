import { Icon } from '@tet/ui';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import TextareaControlled from 'ui/shared/form/TextareaControlled';

/** Affiche l'en-tête d'une page détail d'un indicateur */
type HeaderProps = {
  title: string;
  isReadonly?: boolean;
  onUpdate?: (value: string) => void;
};
export const HeaderIndicateur = ({
  title,
  isReadonly = true,
  onUpdate,
}: HeaderProps) => {
  const titreInputRef = useRef<HTMLTextAreaElement>(null);

  const handleEditFocus = () => {
    if (titreInputRef && titreInputRef.current) {
      titreInputRef.current.focus();
    }
  };

  const handleChangeTitle = () => {
    if (titreInputRef.current && onUpdate) {
      if (title) {
        titreInputRef.current.value !== title &&
          onUpdate(titreInputRef.current.value.trim());
      } else {
        titreInputRef.current.value.trim().length > 0 &&
          onUpdate(titreInputRef.current.value.trim());
      }
    }
  };

  const handleEnterKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titreInputRef.current?.blur();
    }
  };

  useEffect(() => {
    const currentRef = titreInputRef.current;
    currentRef?.addEventListener('keydown', handleEnterKeydown);
    return () => {
      currentRef?.removeEventListener('keydown', handleEnterKeydown);
    };
  }, []);

  return (
    <div
      className={classNames(
        'mt-4 group sticky top-0 flex items-center mx-auto py-6 px-6 text-grey-9 bg-bf925 z-40',
        { 'cursor-text': !isReadonly }
      )}
      onClick={!isReadonly ? handleEditFocus : undefined}
    >
      <div className={classNames('flex grow m-0 font-bold leading-snug')}>
        <TextareaControlled
          data-test="HeaderTitleInput"
          ref={titreInputRef}
          className={classNames(
            'w-full leading-snug !outline-none !resize-none !text-lg'
          )}
          initialValue={title}
          placeholder={'Sans titre'}
          onBlur={handleChangeTitle}
          disabled={isReadonly}
        />
        <Icon
          icon="edit-line"
          className="my-auto ml-6 hidden group-hover:block"
        />
      </div>
    </div>
  );
};
