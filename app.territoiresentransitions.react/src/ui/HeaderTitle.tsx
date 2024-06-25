import classNames from 'classnames';
import {useEffect, useRef} from 'react';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import {generateTitle} from '../app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {Icon} from '@tet/ui';

type Props = {
  titre: string | null;
  onUpdate?: (value: string) => void;
  customClass?: {
    container?: string;
    text?: string;
  };
  /** si la valeur est donnée réduit la taille des éléments */
  isScrolled?: boolean;
  isReadonly: boolean;
};

/**
 * Titre d'une page plan d'action
 * @param titre - le titre de la page
 * @param onUpdate - rend le titre éditable
 * @param customClass - les classes permettant de styliser le header
 * @param isReadonly - est ce que le titre peut-il être éditer
 * @returns
 */
const HeaderTitle = ({
  titre,
  onUpdate,
  customClass,
  isScrolled,
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
        'group flex items-center mx-auto py-6 px-10',
        {'cursor-text': !isReadonly},
        customClass?.container || 'bg-primary',
        {'!py-2': isScrolled}
      )}
      onClick={!isReadonly ? handleEditFocus : undefined}
    >
      <div
        className={classNames(
          'flex grow m-0 font-bold leading-snug text-white'
        )}
      >
        {onUpdate && !isScrolled ? (
          <>
            <TextareaControlled
              data-test="HeaderTitleInput"
              ref={titreInputRef}
              className={classNames(
                'w-full leading-snug placeholder:text-white focus:placeholder:text-gray-200 disabled:text-white !outline-none !resize-none',
                customClass?.text || '!text-[1.375rem]'
              )}
              initialValue={titre}
              placeholder={'Sans titre'}
              onBlur={handleChangeTitle}
              disabled={isReadonly}
            />
            {/* <span className="fr-fi-edit-line my-auto ml-6 hidden group-hover:block" /> */}
            <Icon
              icon="edit-line"
              className="my-auto ml-6 text-grey-9 hidden group-hover:block"
            />
          </>
        ) : (
          <span
            className={classNames(
              'block py-2 px-3',
              customClass?.text || 'text-[1.375rem]',
              {'!text-base !leading-none': isScrolled}
            )}
          >
            {generateTitle(titre)}
          </span>
        )}
      </div>
    </div>
  );
};

export default HeaderTitle;
