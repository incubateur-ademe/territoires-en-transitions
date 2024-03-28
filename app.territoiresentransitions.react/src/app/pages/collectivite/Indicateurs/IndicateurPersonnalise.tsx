import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import InputControlled from 'ui/shared/form/InputControlled';
import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import FormField from 'ui/shared/form/FormField';
import {ToolbarIconButton} from 'ui/buttons/ToolbarIconButton';
import {TIndicateurPersonnalise} from './types';
import {useUpsertIndicateurPersoDefinition} from './useUpsertIndicateurPersoDefinition';
import {useExportIndicateurs} from './useExportIndicateurs';
import {HeaderIndicateur} from './detail/HeaderIndicateur';
import {IndicateurValuesTabs} from './detail/IndicateurValuesTabs';
import {FichesActionLiees} from './FichesActionLiees';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {IndicateurInfoLiees} from './detail/IndicateurInfoLiees';
import {useIndicateurPersonnalise} from './useIndicateurDefinition';
import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/detail/IndicateurDetailChart';

/** Affiche le détail d'un indicateur personnalisé */
const IndicateurPersonnaliseBase = ({
  definition,
}: {
  definition: TIndicateurPersonnalise;
}) => {
  const {description, unite, nom, rempli} = definition;
  const {mutate: saveDefinition} = useUpsertIndicateurPersoDefinition();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite?.readonly;
  const {mutate: exportIndicateurs, isLoading} = useExportIndicateurs([
    definition,
  ]);

  // génère les fonctions d'enregistrement des modifications
  const handleUpdate = (
    name: 'description' | 'unite' | 'titre',
    value: string
  ) => {
    const collectivite_id = collectivite?.collectivite_id;
    const nouveau = value?.trim();
    if (collectivite_id && nouveau !== definition[name]) {
      const {id, description, commentaire, unite, titre} = definition;
      saveDefinition({
        definition: {
          collectivite_id,
          id,
          commentaire,
          description,
          unite,
          titre,
          [name]: nouveau,
        },
      });
    }
  };

  return (
    <>
      <HeaderIndicateur
        title={nom}
        isReadonly={isReadonly}
        onUpdate={value => handleUpdate('titre', value)}
      />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <ToolbarIconButton
            className="fr-mr-1w"
            disabled={isLoading}
            icon="download"
            title="Exporter"
            onClick={() => exportIndicateurs()}
          />
        </div>

        <IndicateurDetailChart
          definition={definition}
          rempli={definition.rempli}
          titre={definition.titre}
          fileName={definition.nom}
        />

        <BadgeACompleter a_completer={!rempli} className="fr-mt-5w fr-mb-3w" />
        <IndicateurValuesTabs definition={definition} />
        <FormField
          className="fr-mt-5w"
          label="Description et méthodologie de calcul"
        >
          <TextareaControlled
            data-test="desc"
            className="fr-input fr-mt-1w !outline-none"
            initialValue={description}
            readOnly={isReadonly}
            onBlur={e => handleUpdate('description', e.target.value)}
          />
        </FormField>
        <IndicateurInfoLiees definition={definition} />
        <FichesActionLiees definition={definition} />
        <FormField label="Unité" className="fr-mt-3w fr-label">
          <InputControlled
            className="fr-input fr-mt-1w !outline-none"
            initialValue={unite}
            readOnly={isReadonly}
            onBlur={e => handleUpdate('unite', e.target.value)}
          />
        </FormField>
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};

/** Charge les données et affiche le détail d'un indicateur personnalisé */
export const IndicateurPersonnalise = ({
  indicateurId,
}: {
  indicateurId: string;
}) => {
  const {data: definition} = useIndicateurPersonnalise(parseInt(indicateurId));
  if (!definition) return null;

  return <IndicateurPersonnaliseBase definition={definition} />;
};
