import FicheActionSupprimer from './FicheActionSupprimer';
import classNames from 'classnames';
import FicheActionModifier from './FicheActionModifier';
import {FicheAction} from '../../FicheAction/data/types';

type FicheActionMenuProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionMenu = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
}: FicheActionMenuProps) => {
  const {id: ficheId, titre, axes} = fiche;

  return (
    <div className={classNames('flex gap-4', className)}>
      {!isReadonly && (
        <FicheActionModifier fiche={fiche} updateFiche={updateFiche} />
      )}
      {!isReadonly && (
        <FicheActionSupprimer
          ficheId={ficheId}
          title={titre}
          isInMultipleAxes={!!axes && axes.length > 1}
          buttonClassName="!text-error-1 hover:!text-[#db4f4f]"
        />
      )}
    </div>
  );
};

export default FicheActionMenu;
