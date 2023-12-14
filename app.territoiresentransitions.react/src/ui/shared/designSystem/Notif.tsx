import classNames from 'classnames';

type Status = 'default' | 'warning' | 'info' | 'error';

type Props = {
  status?: Status;
  icon?: React.ReactElement;
  number?: number;
};

/** Affiche un nombre et/ou un icon dans un rond ,
 * donner le bon statut pour avoir la couleur voulue en fonction du statut */
const Notif = ({status = 'default', icon, number}: Props) => {
  const statusToColor: Record<Status, string> = {
    default: 'text-primary fill-primary bg-primary-3',
    warning: 'text-white fill-white bg-warning-1',
    info: 'text-white fill-white bg-info-1',
    error: 'text-white fill-white bg-error-1',
  };
  return (
    <div
      className={classNames(
        statusToColor[status],
        'inline-flex items-center gap-1 p-2 rounded-full border-2 border-grey-1 shadow'
      )}
    >
      {!!number && (
        <span className="font-extrabold leading-none">{number}</span>
      )}
      {icon}
    </div>
  );
};

export default Notif;
