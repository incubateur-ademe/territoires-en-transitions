import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {TIndicateurDefinition} from '../types';
import {useIndicateurInfoLiees} from './useIndicateurInfoLiees';
import {useUpsertIndicateurPilote} from './useUpsertIndicateurPilote';
import {useUpsertIndicateurServicePilote} from './useUpsertIndicateurServicePilote';
import {useUpsertIndicateurPersoThematique} from './useUpsertIndicateurPersoThematique';
import ServicePiloteDropdown from '../../PlansActions/FicheAction/FicheActionForm/ServicePiloteDropdown';
import {Field} from '@tet/ui';
import ThematiquesDropdown from 'ui/DropdownLists/ThematiquesDropdown';
import {getPersonneStringId} from 'ui/DropdownLists/PersonnesDropdown/utils';
import PersonnesDropdown from 'ui/DropdownLists/PersonnesDropdown/PersonnesDropdown';

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

  // Il y a un bug dans la fonction useIndicateurInfoLiees
  // qui duplique les pilotes lorsque l'on sélectionne
  // à la fois des user et des tags
  const pilotes = resume?.pilotes?.map(p => getPersonneStringId(p));
  const pilotesValues = [...new Set(pilotes)];

  return (
    <>
      {/** personne pilote */}
      <Field title="Personne pilote">
        <PersonnesDropdown
          values={resume?.pilotes.length ? pilotesValues : undefined}
          onChange={upsertIndicateurPilote}
          disabled={isReadonly}
        />
      </Field>
      {/** services pilotes */}
      <Field title="Direction ou service pilote">
        <ServicePiloteDropdown
          services={resume?.services || []}
          onSelect={upsertIndicateurServicePilote}
          isReadonly={isReadonly}
        />
      </Field>
      {/** Thématiques */}
      {definition.isPerso && (
        <Field title="Thématique">
          <ThematiquesDropdown
            values={
              resume?.thematiques.length
                ? resume.thematiques?.map(t => t.id)
                : undefined
            }
            onChange={upsertIndicateurPersoThematique}
            disabled={isReadonly}
          />
        </Field>
      )}
    </>
  );
};
