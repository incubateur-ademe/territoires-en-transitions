import {useMemo} from 'react';
import classNames from 'classnames';
import {NiveauAcces} from 'generated/dataLayer';

type Props = {
  acces: NiveauAcces | null;
  className?: string;
};

const CollectiviteAccesChip = ({acces, className}: Props) => {
  const displayedAcces = useMemo(() => {
    if (!acces) {
      return 'visite';
    }
    if (acces === 'edition') {
      return 'édition';
    }
    return acces;
  }, [acces]);

  return (
    <div
      className={classNames(
        `${className} px-2 py-0.5 font-bold text-xs uppercase rounded-md text-blue-600 bg-blue-200`,
        {
          ['text-blue-600 bg-blue-100']:
            acces === 'admin' || acces === 'edition' || acces === 'lecture',
        },
        {
          ['text-yellow-800 bg-yellow-100']: acces === null,
        }
      )}
    >
      {displayedAcces}
    </div>
  );
};

export default CollectiviteAccesChip;
