import classNames from 'classnames';
import {FicheAction} from '../../FicheAction/data/types';
import ModaleDescription from './ModaleDescription';
import ModaleEmplacement from './EmplacementFiche/ModaleEmplacement';
import ModaleSuppression from './ModaleSuppression';

type MenuDescriptionProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const MenuDescription = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
}: MenuDescriptionProps) => {
  const {id: ficheId, titre, axes} = fiche;

  return !isReadonly ? (
    <div className={classNames('flex gap-4', className)}>
      <ModaleDescription fiche={fiche} updateFiche={updateFiche} />
      <ModaleEmplacement fiche={fiche} />
      <ModaleSuppression
        ficheId={ficheId}
        title={titre}
        isInMultipleAxes={!!axes && axes.length > 1}
        buttonClassName="!text-error-1 hover:!text-[#db4f4f]"
      />
    </div>
  ) : null;
};

export default MenuDescription;
