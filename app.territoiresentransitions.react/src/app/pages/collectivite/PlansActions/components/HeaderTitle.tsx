import classNames from 'classnames';
import {useEffect, useRef} from 'react';
import TextareaControlled from 'ui/shared/form/TextareaControlled';

type Props = {
  titre: string | null;
  onUpdate?: (value: string) => void;
  bgColorClassName?: string;
  type?: 'fiche' | 'plan';
  isReadonly: boolean;
};

const HeaderTitle = ({
  titre,
  onUpdate,
  type = 'fiche',
  bgColorClassName,
  isReadonly,
}: Props) => {
  const titreInputRef = useRef<HTMLTextAreaElement>(null);

  const handleEditFocus = () => {
    if (titreInputRef && titreInputRef.current) {
      titreInputRef.current.focus();
    }
  };

  const handleChangeTitle = () => {
    if (titreInputRef.current && onUpdate) {
      if (titre) {
        titreInputRef.current.value !== titre &&
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
      handleChangeTitle();
      titreInputRef.current?.blur();
    }
  };

  useEffect(() => {
    titreInputRef.current?.addEventListener('keydown', handleEnterKeydown);
    return () => {
      titreInputRef.current?.removeEventListener('keydown', handleEnterKeydown);
    };
  }, []);

  return (
    <div
      className={classNames(
        'group flex items-center mx-auto py-6 px-10 xl:mr-6',
        {'cursor-text': !isReadonly},
        {'bg-indigo-700': type === 'plan'},
        {'bg-indigo-400': type === 'fiche'},
        bgColorClassName
      )}
      onClick={!isReadonly ? handleEditFocus : undefined}
    >
      <p
        className={classNames('flex grow m-0 font-bold text-white', {
          'text-[1.375rem] leading-snug': type === 'fiche',
          'text-[2rem] leading-snug': type === 'plan',
        })}
      >
        {onUpdate ? (
          <TextareaControlled
            data-test="HeaderTitleInput"
            ref={titreInputRef}
            className={classNames(
              'w-full placeholder:text-white focus:placeholder:text-gray-200 disabled:text-white !outline-none !resize-none',
              {
                'text-[1.375rem] leading-snug': type === 'fiche',
                'text-[2rem] leading-snug': type === 'plan',
              }
            )}
            initialValue={titre}
            placeholder={'Sans titre'}
            onBlur={handleChangeTitle}
            disabled={isReadonly}
          />
        ) : (
          <span className="block py-2 px-3">{titre ?? 'Sans titre'}</span>
        )}
      </p>
    </div>
  );
};

export default HeaderTitle;
