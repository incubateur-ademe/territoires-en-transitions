import classNames from 'classnames';
import {useRef} from 'react';
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

  const handleEditButtonClick = () => {
    if (titreInputRef && titreInputRef.current) {
      titreInputRef.current.focus();
    }
  };

  return (
    <div
      className={classNames(
        'group flex items-center mx-auto py-6 px-10 xl:mr-6',
        {'bg-indigo-700': type === 'plan'},
        {'bg-indigo-400': type === 'fiche'},
        bgColorClassName
      )}
    >
      <p
        className={classNames('flex grow m-0 font-bold text-white', {
          'text-[1.375rem] leading-snug': type === 'fiche',
          'text-[2rem] leading-snug': type === 'plan',
        })}
      >
        {onUpdate ? (
          <TextareaControlled
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
            onBlur={e => {
              if (titre) {
                e.target.value !== titre && onUpdate(e.target.value.trim());
              } else {
                e.target.value.trim().length > 0 &&
                  onUpdate(e.target.value.trim());
              }
            }}
            disabled={isReadonly}
          />
        ) : (
          <span className="block py-2 px-3">{titre ?? 'Sans titre'}</span>
        )}
      </p>
      {!isReadonly && onUpdate && (
        <button
          className="group-hover:visible invisible fr-fi-edit-line m-auto w-8 h-8 text-white"
          onClick={handleEditButtonClick}
        />
      )}
    </div>
  );
};

export default HeaderTitle;
