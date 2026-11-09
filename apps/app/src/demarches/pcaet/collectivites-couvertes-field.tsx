import { appLabels } from '@/app/labels/catalog';
import {
  DemarchePcaetStatusEnum,
  isDemarchePcaetEnCours,
  type EpciCandidat,
} from '@tet/domain/demarches';
import { Badge, Checkbox, Field } from '@tet/ui';
import { format, parseISO } from 'date-fns';
import { JSX } from 'react';

const FIELD_ID = 'create-demarche-pcaet-collectivites-couvertes';

const formatDateDebut = (date: string): string =>
  format(parseISO(date), 'dd/MM/yyyy');

const StatutDerniereDemarche = ({
  derniereDemarche,
  engagement,
}: Pick<EpciCandidat, 'derniereDemarche' | 'engagement'>): JSX.Element => {
  if (engagement) {
    return (
      <Badge
        size="xs"
        variant="info"
        type="outlined"
        title={appLabels.demarcheEpciCandidatEnCours}
      />
    );
  }
  if (!derniereDemarche) {
    return (
      <Badge
        size="xs"
        variant="grey"
        type="outlined"
        title={appLabels.instructionStatutAucunDepot}
      />
    );
  }
  if (isDemarchePcaetEnCours(derniereDemarche.status)) {
    return (
      <Badge
        size="xs"
        variant="info"
        type="outlined"
        title={appLabels.demarcheEpciCandidatEnCours}
      />
    );
  }
  return (
    <Badge
      size="xs"
      variant="success"
      type="outlined"
      title={
        derniereDemarche.status === DemarchePcaetStatusEnum.ARCHIVE
          ? appLabels.instructionStatutArchive
          : appLabels.instructionStatutAdopte
      }
    />
  );
};

type Props = {
  candidats: EpciCandidat[];
  value: number[];
  onChange: (ids: number[]) => void;
  errorMessage?: string;
};

/**
 * Les EPCI membres du Supra, à cocher : le Supra dit lui-même lesquels son
 * PCAET couvre, la liste BANATIC ne fait que les proposer. Un EPCI déjà engagé
 * dans une démarche en cours est grisé, avec sa raison.
 */
export const CollectivitesCouvertesField = ({
  candidats,
  value,
  onChange,
  errorMessage,
}: Props): JSX.Element => {
  const selection = new Set(value);
  const disponibles = candidats.filter(({ engagement }) => !engagement);
  const toutSelectionne =
    disponibles.length > 0 && disponibles.every(({ id }) => selection.has(id));

  const toggle = (id: number) =>
    onChange(
      selection.has(id)
        ? value.filter((selectionne) => selectionne !== id)
        : [...value, id]
    );

  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-describedby={`${FIELD_ID}-description`}
      data-test="demarches.creer.collectivites-couvertes"
    >
      <legend className="text-primary-9 mb-1">
        {appLabels.demarcheCreerCollectivitesCouvertes}
      </legend>
      <p id={`${FIELD_ID}-description`} className="text-sm text-grey-7 m-0">
        {appLabels.demarcheCreerCollectivitesCouvertesDescription}
      </p>

      {candidats.length === 0 ? (
        <p className="text-sm text-grey-8 m-0">
          {appLabels.demarcheCreerCollectivitesCouvertesAucune}
        </p>
      ) : (
        <Field
          state={errorMessage ? 'error' : 'default'}
          message={errorMessage}
        >
          <div className="flex flex-col rounded-lg border border-grey-3">
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-grey-3 bg-grey-1">
              <Checkbox
                size="sm"
                label={
                  appLabels.demarcheCreerCollectivitesCouvertesToutSelectionner
                }
                checked={toutSelectionne}
                disabled={disponibles.length === 0}
                onChange={() =>
                  onChange(
                    toutSelectionne ? [] : disponibles.map(({ id }) => id)
                  )
                }
                data-test="demarches.creer.collectivites-couvertes.tout"
              />
              <span className="text-sm text-grey-7">
                {appLabels.demarcheCreerCollectivitesCouvertesCompteur({
                  selectionnees: selection.size,
                  total: disponibles.length,
                })}
              </span>
            </div>
            <ul className="flex flex-col m-0 p-0 list-none">
              {candidats.map((candidat) => (
                <li
                  key={candidat.id}
                  className="flex items-center justify-between gap-4 px-4 py-2 border-b border-grey-3 last:border-b-0"
                >
                  <Checkbox
                    size="sm"
                    label={
                      <span className="flex items-baseline gap-2">
                        {candidat.nom}
                        {candidat.departementCode && (
                          <span className="text-xs text-grey-6">
                            {candidat.departementCode}
                          </span>
                        )}
                      </span>
                    }
                    checked={selection.has(candidat.id)}
                    disabled={candidat.engagement !== null}
                    message={
                      candidat.engagement
                        ? appLabels.demarcheEpciCandidatEngage({
                            porteur: candidat.engagement.porteur?.nom ?? null,
                            dateDebut: formatDateDebut(
                              candidat.engagement.dateDebut
                            ),
                          })
                        : undefined
                    }
                    onChange={() => toggle(candidat.id)}
                    data-test={`demarches.creer.collectivites-couvertes.${candidat.id}`}
                  />
                  <StatutDerniereDemarche
                    derniereDemarche={candidat.derniereDemarche}
                    engagement={candidat.engagement}
                  />
                </li>
              ))}
            </ul>
          </div>
        </Field>
      )}
    </fieldset>
  );
};
