import { Button, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { appLabels } from '@/app/labels/catalog';

type Props = {
  disabled: boolean;
  className?: string;
  onClick: () => void;
};

const ContactButton = ({ disabled, className, onClick }: Props) => {
  return (
    <Tooltip
      label="Contacts non renseignés"
      openingDelay={0}
      className={classNames({ hidden: !disabled })}
    >
      <Button
        size="xs"
        variant="grey"
        icon="mail-line"
        className={classNames('!px-3', className)}
        disabled={disabled}
        onClick={onClick}
      >
        {appLabels.voirContacts}
      </Button>
    </Tooltip>
  );
};

export default ContactButton;
