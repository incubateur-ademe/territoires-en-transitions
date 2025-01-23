import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Field } from '@/ui';
import { objectToCamel } from 'ts-case-convert';
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
  const { data: serviceIds } = useIndicateurServices(definition.id);
  const { data: thematiques } = useIndicateurThematiques(definition.id);

  // fonctions de mise à jour des données
  const { mutate: upsertIndicateurPilote } = useUpsertIndicateurPilote(
    definition.id
  );
  const { mutate: upsertIndicateurServicePilote } = useUpsertIndicateurServices(
    definition.id
  );
  const { mutate: upsertIndicateurPersoThematique } =
    useUpsertIndicateurThematiques({
      id: definition.id,
      estPerso: definition.estPerso,
    });

  const collectivite = useCurrentCollectivite();
  if (!collectivite) return;
  const isReadonly = !collectivite || collectivite.isReadOnly;

  // extrait les userId et les tagId
  const pilotesValues = pilotes
    ?.map((p) => p.userId || p.tagId?.toString())
    .filter((id) => !!id) as string[];

  return (
    <div className="flex flex-col gap-8">
      {/** personne pilote */}
      <Field title="Personne pilote">
        <PersonnesDropdown
          values={pilotes?.length ? pilotesValues : undefined}
          onChange={({ personnes }) => {
            upsertIndicateurPilote(
              personnes.map((personne) => ({
                collectiviteId: collectivite.collectiviteId,
                tagId: personne.tagId,
                userId: personne.userId,
              }))
            );
          }}
          disabled={isReadonly}
          dropdownZindex={30}
        />
      </Field>
      {/** services pilotes */}
      <Field title="Direction ou service pilote">
        <ServicesPilotesDropdown
          values={serviceIds}
          onChange={({ services }) =>
            upsertIndicateurServicePilote(objectToCamel(services))
          }
          disabled={isReadonly}
          dropdownZindex={30}
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
    </div>
  );
};
