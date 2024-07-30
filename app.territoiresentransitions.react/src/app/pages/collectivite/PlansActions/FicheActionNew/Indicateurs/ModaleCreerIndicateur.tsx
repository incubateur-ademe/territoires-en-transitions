import {useEffect, useState} from 'react';
import _ from 'lodash';
import {Modal} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';

type ModaleCreerIndicateurProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
};

const ModaleCreerIndicateur = ({
  isOpen,
  setIsOpen,
  fiche,
}: ModaleCreerIndicateurProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen, fiche]);

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Créer un indicateur personnalisé"
      size="lg"
      render={({close}) => (
        <IndicateurPersoNouveau onClose={close} fiche={fiche} />
      )}
    />
  );
};

export default ModaleCreerIndicateur;
