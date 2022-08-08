import classNames from 'classnames';
import {NiveauAcces} from 'generated/dataLayer';

type Props = {
  acces: NiveauAcces | null;
  className?: string;
};

const CollectiviteAccesChip = ({acces, className}: Props) => {
  return (
    <div
      className={classNames(
        `${className} px-2 py-0.5 font-bold text-xs uppercase rounded-md text-blue-600 bg-blue-200`,
        {
          ['text-blue-600 bg-blue-100']:
            acces === 'admin' || acces === 'edition',
        },
        {
          ['text-yellow-800 bg-yellow-100']:
            acces === 'lecture' || acces === null,
        }
      )}
    >
      {acces ?? 'Visiteur'}
    </div>
  );
};

export default CollectiviteAccesChip;
