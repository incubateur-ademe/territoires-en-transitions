import { Divider } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { TIndicateurDefinition } from '../types';
import DescriptionIndicateurInput from './DescriptionIndicateurInput';
import ThematiquesIndicateurInput from './ThematiquesIndicateurInput';
import UniteIndicateurInput from './UniteIndicateurInput';

type Props = {
  definition: TIndicateurDefinition;
  isPerso?: boolean;
  isReadonly?: boolean;
  updateUnite: (value: string) => void;
  updateDescription: (value: string) => void;
};

const DonneesIndicateur = ({
  definition,
  isPerso = false,
  isReadonly = false,
  updateUnite,
  updateDescription,
}: Props) => {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const { description, commentaire, unite } = definition;

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      {/* Unité personnalisée - à metttre à jour */}
      {isPerso && (
        <UniteIndicateurInput
          unite={unite}
          updateUnite={updateUnite}
          disabled={isReadonly}
        />
      )}

        {/* Graphe */}
        <IndicateurDetailChart
          className="mb-6"
          definition={definition}
        />


      <div
        className={classNames('flex flex-col gap-7', {
          'invisible h-0': !rempli,
        })}
      >
        <Divider />

        {/* Tableau */}
        <IndicateurValuesTabs
          definition={definition}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

        <Divider className="mt-6" />
      </div>

      {/* Thématiques */}
      {isPerso && (
        <ThematiquesIndicateurInput
          definition={definition}
          disabled={isReadonly}
        />
      )}

      {/* Description */}
      <DescriptionIndicateurInput
        description={isPerso ? description : commentaire}
        updateDescription={updateDescription}
        disabled={isReadonly}
      />
    </div>
  );
};

export default DonneesIndicateur;
