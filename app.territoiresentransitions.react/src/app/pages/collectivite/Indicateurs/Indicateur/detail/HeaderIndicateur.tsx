import classNames from 'classnames';
import HeaderTitle from 'ui/HeaderTitle';

/** Affiche l'en-tête d'une page détail d'un indicateur */
type HeaderProps = {
  title: string;
  isReadonly?: boolean;
  onUpdate?: (value: string) => void;
};
export const HeaderIndicateur = ({
  title,
  isReadonly,
  onUpdate,
}: HeaderProps) => {
  const readonly = isReadonly ?? true;

  return (
    <>
      <HeaderTitle
        titre={title}
        customClass={{
          container: classNames('!bg-bf925 sticky top-0 z-40 px-0 fr-px-7v', {
            'pb-0': !readonly,
          }),
          text: classNames('!text-[#3a3a3a] text-[1rem]', {'pb-4': !readonly}),
        }}
        onUpdate={onUpdate}
        isReadonly={readonly}
      />
    </>
  );
};
