import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import InputControlled from 'ui/shared/form/InputControlled';
import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import FormField from 'ui/shared/form/FormField';
import {TIndicateurPersoDefinition} from './types';
import {useIndicateurPersoDefinition} from './useIndicateursPersoDefinitions';
import {useIndicateurACompleter} from './useIndicateurDefinitions';
import {useUpsertIndicateurPersoDefinition} from './useUpsertIndicateurPersoDefinition';
import IndicateurChart from './IndicateurChart';
import {HeaderIndicateur} from './Header';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {FichesActionLiees} from './FichesActionLiees';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

/** Affiche le détail d'un indicateur personnalisé */
const IndicateurPersonnaliseBase = ({
  definition,
}: {
  definition: TIndicateurPersoDefinition;
}) => {
  const {id, titre, description, unite} = definition;
  const a_completer = useIndicateurACompleter(id);
  const {mutate: saveDefinition} = useUpsertIndicateurPersoDefinition();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite?.readonly;

  // l'objet à enregistrer ne peut pas contenir `isPerso` qui est un champ ajouté
  // lors du chargement pour des besoins internes au front
  const {isPerso, ...definitionToUpdate} = definition;

  // génère les fonctions d'enregistrement des modifications
  const handleUpdate = (
    name: 'description' | 'unite' | 'titre',
    value: string
  ) => {
    const nouveau = value?.trim();
    if (nouveau !== definition[name]) {
      saveDefinition({...definitionToUpdate, [name]: nouveau});
    }
  };

  return (
    <>
      <HeaderIndicateur
        title={titre}
        isReadonly={isReadonly}
        onUpdate={value => handleUpdate('titre', value)}
      />
      <div className="px-10 py-4">
        <IndicateurChart variant="zoomed" definition={definition} />
        <BadgeACompleter
          a_completer={a_completer}
          className="fr-mt-5w fr-mb-3w"
        />
        <IndicateurValuesTabs definition={definition} />
        <FormField
          className="fr-mt-5w"
          label="Description et méthodologie de calcul"
        >
          <TextareaControlled
            className="fr-input fr-mt-1w !outline-none"
            initialValue={description}
            onBlur={e => handleUpdate('description', e.target.value)}
          />
        </FormField>
        <FichesActionLiees definition={definition} />
        <FormField label="Unité" className="fr-mt-3w fr-label">
          <InputControlled
            className="fr-input fr-mt-1w !outline-none"
            initialValue={unite}
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
  const definition = useIndicateurPersoDefinition(parseInt(indicateurId));
  if (!definition) return null;

  return <IndicateurPersonnaliseBase definition={definition} />;
};
