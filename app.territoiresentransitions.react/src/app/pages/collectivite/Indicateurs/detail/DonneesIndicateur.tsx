import { ImportSourcesSelector } from '../Indicateur/detail/ImportSourcesSelector';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurInfoLiees } from '../Indicateur/detail/IndicateurInfoLiees';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { useIndicateurImportSources } from '../Indicateur/detail/useImportSources';
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
  const { description, commentaire, unite, rempli, titre, titreLong } =
    definition;

  const { sources, currentSource, setCurrentSource } =
    useIndicateurImportSources(definition.id);

  return (
    <div className="flex flex-col gap-8 bg-white p-10 border border-grey-3 rounded-xl">
      {!!sources?.length && (
        <ImportSourcesSelector
          definition={definition}
          sources={sources}
          currentSource={currentSource}
          setCurrentSource={setCurrentSource}
        />
      )}

      {/* Graphe */}
      <IndicateurDetailChart
        className="mb-8"
        definition={definition}
        source={currentSource}
        rempli={rempli}
        titre={titreLong || titre}
        fileName={titre}
      />

      {/* Tableau */}
      <IndicateurValuesTabs
        definition={definition}
        importSource={currentSource}
      />

      {/* Description */}
      <DescriptionIndicateurInput
        description={isPerso ? description : commentaire}
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
