import { Button, ButtonSize } from '@/ui';
import classNames from 'classnames';

export type ButtonsListType = { id: number; label: string; url?: string }[];

type ButtonsListProps = {
  boutons: ButtonsListType;
  buttonsSize?: ButtonSize;
  className?: string;
};

const ButtonsList = ({
  boutons,
  buttonsSize = 'md',
  className,
}: ButtonsListProps) => {
  if (boutons.length === 0) return null;

  return (
    <div className={classNames('flex flex-wrap gap-4', className)}>
      {boutons.map((bouton, idx) => (
        <Button
          key={`${bouton.id}-${bouton.label}`}
          href={bouton.url ?? undefined}
          className="button"
          variant={idx === 0 ? 'primary' : 'outlined'}
          size={buttonsSize}
          external={bouton.url?.startsWith('http')}
          disabled={!bouton.url || bouton.url.trim().length === 0}
        >
          {bouton.label}
        </Button>
      ))}
    </div>
  );
};

export default ButtonsList;
