import { Field } from '@tet/ui';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { objectToCamel } from 'ts-case-convert';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { TIndicateurDefinition } from '../../types';
import {
  useIndicateurPilotes,
  useUpsertIndicateurPilote,
} from './useIndicateurPilotes';
import {
  useIndicateurServices,
  useUpsertIndicateurServices,
} from './useIndicateurServices';
import {
  useIndicateurThematiques,
  useUpsertIndicateurThematiques,
} from './useIndicateurThematiques';

export type TIndicateurInfoLieesProps = {
  definition: TIndicateurDefinition;
};

/**
 * Affiche les informations complémentaires (pilotes, etc.) associées à un indicateur
 */
export const IndicateurInfoLiees = (props: TIndicateurInfoLieesProps) => {
  const { definition } = props;

  // charge les informations complémentaires associées à l'indicateur
  const { data: pilotes } = useIndicateurPilotes(definition.id);
  const { data: services } = useIndicateurServices(definition.id);
  const { data: thematiques } = useIndicateurThematiques(definition.id);

  // fonctions de mise à jour des données
  const { mutate: upsertIndicateurPilote } = useUpsertIndicateurPilote(
    definition.id
  );
  const { mutate: upsertIndicateurServicePilote } =
    useUpsertIndicateurServices(definition);
  const { mutate: upsertIndicateurPersoThematique } =
    useUpsertIndicateurThematiques(definition);

  const collectivite = useCurrentCollectivite();
  if (!collectivite) return;
  const isReadonly = !collectivite || collectivite.readonly;

  // extrait les userId et les tagId
  const pilotesValues = pilotes
    ?.map((p) => p.userId || p.tagId?.toString())
    .filter((id) => !!id) as string[];

  return (
    <>
      {/** personne pilote */}
      <Field title="Personne pilote">
        <PersonnesDropdown
          values={pilotes?.length ? pilotesValues : undefined}
          onChange={({ personnes }) => {
            upsertIndicateurPilote(
              personnes.map((personne) => ({
                collectiviteId: collectivite.collectivite_id,
                tagId: personne.tagId,
                userId: personne.userId,
              }))
            );
          }}
          disabled={isReadonly}
        />
      </Field>
      {/** services pilotes */}
      <Field title="Direction ou service pilote">
        <ServicesPilotesDropdown
          values={services?.map((s) => s.id!)}
          onChange={({ services }) =>
            upsertIndicateurServicePilote(objectToCamel(services))
          }
          disabled={isReadonly}
        />
      </Field>
      {/** Thématiques */}
      {definition.estPerso && (
        <Field title="Thématique">
          <ThematiquesDropdown
            values={thematiques}
            onChange={({ thematiques }) =>
              upsertIndicateurPersoThematique(thematiques)
            }
            disabled={isReadonly}
          />
        </Field>
      )}
    </>
  );
};
