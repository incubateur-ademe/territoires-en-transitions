import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurInfoLiees } from '../Indicateur/detail/IndicateurInfoLiees';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { TIndicateurDefinition } from '../types';
import DescriptionIndicateurInput from './DescriptionIndicateurInput';
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
  const { description, unite, rempli, titre } = definition;

  return (
    <div className="flex flex-col gap-8">
      {/* Graphe */}
      <IndicateurDetailChart
        className="mb-8"
        definition={definition}
        rempli={rempli}
        titre={titre}
        fileName={titre}
      />

      {/* Tableau */}
      <IndicateurValuesTabs definition={definition} />

      {/* Description */}
      <DescriptionIndicateurInput
        description={description}
        updateDescription={updateDescription}
        disabled={isReadonly}
      />

      {/* Infos liées - à déplacer */}
      <IndicateurInfoLiees definition={definition} />

      {/* Unité personnalisée - à déplacer */}
      {isPerso && (
        <UniteIndicateurInput
          unite={unite}
          updateUnite={updateUnite}
          disabled={isReadonly}
        />
      )}
    </div>
  );
};

export default DonneesIndicateur;
