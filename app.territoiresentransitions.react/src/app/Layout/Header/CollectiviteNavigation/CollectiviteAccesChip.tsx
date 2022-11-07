import classNames from 'classnames';
import {NiveauAcces} from 'generated/dataLayer';

type Props = {
  acces: NiveauAcces | null;
  isAuditeur?: boolean;
  className?: string;
};

const getLabel = ({acces, isAuditeur}: Props) => {
  if (!acces) {
    return 'visite';
  }
  if (isAuditeur) {
    return 'audit';
  }
  if (acces === 'edition') {
    return 'édition';
  }
  return acces;
};

const CollectiviteAccesChip = (props: Props) => {
  const {acces, className} = props;
  const displayedAcces = getLabel(props);

  return (
    <div
      className={classNames(
        `${className} px-2 py-0.5 font-bold text-xs uppercase rounded-md text-blue-600 bg-blue-200`,
        {
          'text-blue-600 bg-blue-100': acces !== null,
        },
        {
          'text-yellow-800 bg-yellow-100': acces === null,
        }
      )}
    >
      {displayedAcces}
    </div>
  );
};

export default CollectiviteAccesChip;
