import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import FormField from 'ui/shared/form/FormField';
import {TIndicateurDefinition} from '../types';
import {useIndicateurInfoLiees} from './useIndicateurInfoLiees';
import {useUpsertIndicateurPilote} from './useUpsertIndicateurPilote';
import {useUpsertIndicateurServicePilote} from './useUpsertIndicateurServicePilote';
import {useUpsertIndicateurPersoThematique} from './useUpsertIndicateurPersoThematique';
import PersonnePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/PersonnePiloteDropdown';
import ServicePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/ServicePiloteDropdown';
import ThematiquesDropdown from 'app/components/DropdownLists/ThematiquesDropdown';

export type TIndicateurInfoLieesProps = {
  definition: TIndicateurDefinition;
};

/**
 * Affiche les informations complémentaires (pilotes, etc.) associées à un indicateur
 */
export const IndicateurInfoLiees = (props: TIndicateurInfoLieesProps) => {
  const {definition} = props;

  // charge les informations complémentaires associées à l'indicateur
  const {data: resume} = useIndicateurInfoLiees(definition);

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
            [
              'indicateur_info_liees',
              collectivite.collectivite_id,
              definition.id,
            ],
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
        <FormField className="fr-mt-4w z-10" label="Thématique">
          <ThematiquesDropdown
            values={
              resume?.thematiques.length
                ? resume.thematiques?.map(t => t.id)
                : undefined
            }
            onChange={upsertIndicateurPersoThematique}
            disabled={isReadonly}
          />
        </FormField>
      )}
    </>
  );
};
