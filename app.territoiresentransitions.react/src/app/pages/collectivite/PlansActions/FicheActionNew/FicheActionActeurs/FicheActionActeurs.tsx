import classNames from 'classnames';
import {FicheAction} from '../../FicheAction/data/types';
import {Button} from '@tet/ui';

type FicheActionActeursProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionActeurs = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
}: FicheActionActeursProps) => {
  return (
    <div
      className={classNames(
        'bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col items-center gap-7 text-center relative',
        className
      )}
    >
      {!isReadonly && (
        <Button
          icon="edit-line"
          size="xs"
          variant="grey"
          className="absolute top-4 lg:top-5 xl:top-6 right-4 lg:right-5 xl:right-6"
          onClick={() => {}}
          disabled
        />
      )}

      <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
        Acteurs
      </h6>
    </div>
  );
};

export default FicheActionActeurs;
