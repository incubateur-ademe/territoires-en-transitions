import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import FormField from 'ui/shared/form/FormField';
import StructurePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/StructurePiloteDropdown';
import {TIndicateurDefinition} from '../types';
import {useIndicateurResume} from './useIndicateurResume';
import {useUpsertIndicateurPilote} from './useUpsertIndicateurPilote';
import PersonnePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/PersonnePiloteDropdown';

export type TIndicateurLinkedInfoProps = {
  definition: TIndicateurDefinition;
};

/**
 * Affiche les informations complémentaires (pilotes, etc.) associées à un indicateur
 */
export const IndicateurLinkedInfo = (props: TIndicateurLinkedInfoProps) => {
  const {definition} = props;

  // charge les informations complémentaires associées à l'indicateur
  const {data: resume} = useIndicateurResume(definition);

  // fonctions de mise à jour des données
  const {mutate: upsertIndicateurPilote} =
    useUpsertIndicateurPilote(definition);

  const collectivite = useCurrentCollectivite();
  if (!collectivite) return;
  const isReadonly = !collectivite || collectivite.readonly;

  return (
    <>
      {/** structures pilotes */}
      <FormField className="fr-mt-4w" label="Structure pilote">
        <StructurePiloteDropdown
          structures={resume?.services || []}
          onSelect={structures => console.log(structures)}
          isReadonly={isReadonly}
        />
      </FormField>
      {/** personne pilote */}
      <FormField className="fr-mt-4w" label="Personne pilote">
        <PersonnePiloteDropdown
          keysToInvalidate={[
            ['indicateur_resume', collectivite.collectivite_id, definition.id],
          ]}
          personnes={resume?.pilotes || []}
          onSelect={pilotes => upsertIndicateurPilote(pilotes)}
          isReadonly={isReadonly}
        />
      </FormField>
    </>
  );
};
