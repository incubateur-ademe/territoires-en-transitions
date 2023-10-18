import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import FormField from 'ui/shared/form/FormField';
import {TIndicateurDefinition} from '../types';
import {useIndicateurResume} from './useIndicateurResume';
import {useUpsertIndicateurPilote} from './useUpsertIndicateurPilote';
import {useUpsertIndicateurServicePilote} from './useUpsertIndicateurServicePilote';
import {useUpsertIndicateurPersoThematique} from './useUpsertIndicateurPersoThematique';
import PersonnePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/PersonnePiloteDropdown';
import ServicePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/ServicePiloteDropdown';
import ThematiquesDropdown from '../../PlansActions/FicheAction/FicheActionForm/ThematiquesDropdown';

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
  const {mutate: upsertIndicateurServicePilote} =
    useUpsertIndicateurServicePilote(definition);
  const {mutate: upsertIndicateurPersoThematique} =
    useUpsertIndicateurPersoThematique(definition);

  const collectivite = useCurrentCollectivite();
  if (!collectivite) return;
  const isReadonly = !collectivite || collectivite.readonly;

  return (
    <>
      {/** personne pilote */}
      <FormField className="fr-mt-4w" label="Personne pilote">
        <PersonnePiloteDropdown
          keysToInvalidate={[
            ['indicateur_resume', collectivite.collectivite_id, definition.id],
          ]}
          personnes={resume?.pilotes || []}
          onSelect={upsertIndicateurPilote}
          isReadonly={isReadonly}
        />
      </FormField>
      {/** services pilotes */}
      <FormField className="fr-mt-4w" label="Direction ou service pilote">
        <ServicePiloteDropdown
          services={resume?.services || []}
          onSelect={upsertIndicateurServicePilote}
          isReadonly={isReadonly}
        />
      </FormField>
      {/** Thématiques */}
      {definition.isPerso && (
        <FormField className="fr-mt-4w" label="Thématique">
          <ThematiquesDropdown
            thematiques={resume?.thematiques || []}
            onSelect={upsertIndicateurPersoThematique}
            isReadonly={isReadonly}
          />
        </FormField>
      )}
    </>
  );
};
