'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Accordion, Alert, Card } from '@tet/ui';
import {
  useGetDossier,
  type RecetteDossierDetail,
} from '../data/use-get-dossier';
import { RegleLink } from '../regles/regle.link';
import { FriseDates } from './frise-dates';
import { toSpecificiteTexte } from './specificite.texte';

const titreSection = (title: string, subtitle: string) => ({
  title,
  subtitle,
  headerClassname:
    'py-3 min-h-14 text-base [&>div]:flex [&>div]:flex-wrap [&>div]:items-baseline [&>div]:gap-x-3 [&>div>span]:mt-0 [&>div>span]:text-xs [&>div>span]:text-grey-8',
  arrowClassname: 'text-primary-6',
  containerClassname: '!border-b-0 first:!border-t-0',
});

const grouperParBloc = (ecarts: RecetteDossierDetail['ecarts']) => {
  const blocs = new Map<string, RecetteDossierDetail['ecarts']>();
  for (const e of ecarts) {
    blocs.set(e.tableSource, [...(blocs.get(e.tableSource) ?? []), e]);
  }
  return [...blocs];
};

const somme = (ecarts: RecetteDossierDetail['ecarts']) =>
  ecarts.reduce((n, e) => n + e.nombre, 0);

export const DossierNonRepris = ({
  motif,
  section,
}: {
  motif: string | null;
  section: number | null;
}) => (
  <Card className="!p-5" dataTest="admin.reprise-tec.non-repris">
    <p className="mb-0 text-sm">
      <b>{appLabels.repriseTecDossierNonRepris}</b>{' '}
      {motif ? appLabels.repriseTecMotif(motif) : ''}
      <RegleLink numero={section} />
    </p>
  </Card>
);

export const DossierSections = ({
  collectiviteId,
  tecDossierId,
}: {
  collectiviteId: number;
  tecDossierId: number;
}) => {
  const { data, isLoading } = useGetDossier(collectiviteId, tecDossierId);
  if (isLoading || !data) {
    return (
      <div className="flex justify-center p-10">
        <SpinnerLoader />
      </div>
    );
  }
  const { dossier, demarche, suivi, specificites, ecarts } = data;

  if (!demarche) {
    return (
      <DossierNonRepris
        motif={dossier.motif}
        section={dossier.sectionDuMotif}
      />
    );
  }

  return (
    <div
      className="flex flex-col divide-y divide-grey-3 rounded-lg border border-grey-3 bg-white px-4 lg:px-5"
      data-test={`admin.reprise-tec.sections-${tecDossierId}`}
    >
      <Accordion
        {...titreSection(
          appLabels.repriseTecSpecificites,
          appLabels.repriseTecNombreReglesParticulieres({
            count: specificites.length,
          })
        )}
        content={
          <div className="flex flex-col gap-3 pb-4">
            {specificites.length ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {specificites.map((s) => {
                  const { titre, detail } = toSpecificiteTexte(s);
                  return (
                    <Alert
                      key={s.code}
                      state={s.ton === 'warning' ? 'warning' : 'info'}
                      title={titre}
                      description={
                        <span>
                          {detail}
                          {s.regles.map((numero) => (
                            <RegleLink key={numero} numero={numero} />
                          ))}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-grey-8">
                {appLabels.repriseTecCasGeneral}
              </p>
            )}
            <div>
              <h3 className="mb-2 text-sm font-bold text-primary-9">
                {appLabels.repriseTecDatesEtSource}
                <RegleLink numero={2} />
              </h3>
              <FriseDates
                dates={[
                  {
                    libelle: appLabels.repriseTecDateLancement,
                    date: dossier.lanceLe,
                    source: 'tec',
                  },
                  {
                    libelle: appLabels.repriseTecDateReceptionProjet,
                    date: dossier.receptionProjetLe,
                    source: 'tec',
                  },
                  {
                    libelle: appLabels.repriseTecDateAvisEtat,
                    date: suivi.avisEtatLe,
                    source: 'suivi',
                  },
                  {
                    libelle: appLabels.repriseTecDateApprobation,
                    date: suivi.approbationLe,
                    source: 'suivi',
                  },
                  {
                    libelle: appLabels.repriseTecDateTransmission,
                    date: demarche.transmittedAt,
                    source: 'tet',
                  },
                  {
                    libelle: appLabels.repriseTecDateAdoption,
                    date: demarche.adoptedAt,
                    source: 'tet',
                  },
                  {
                    libelle: appLabels.repriseTecDatePublication,
                    date: demarche.publishedAt,
                    source: 'tet',
                  },
                ]}
              />
            </div>
          </div>
        }
      />
      <Accordion
        {...titreSection(
          appLabels.repriseTecJournalEcarts,
          appLabels.repriseTecNombreLignesEcartees({ count: somme(ecarts) })
        )}
        content={
          <div className="flex flex-col gap-3 pb-4">
            {ecarts.length === 0 && (
              <p className="text-sm text-grey-8">
                {appLabels.repriseTecAucunEcart}
              </p>
            )}
            {grouperParBloc(ecarts).map(([bloc, lignes]) => (
              <details key={bloc} className="rounded-md border border-grey-3">
                <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-primary-9">
                  {appLabels.repriseTecTableSource(bloc)}{' '}
                  <span className="font-normal text-grey-8">
                    {'· '}
                    {appLabels.repriseTecNombreEcarts({ count: somme(lignes) })}
                  </span>
                </summary>
                <ul className="m-0 flex list-none flex-col gap-1 border-t border-grey-3 p-3 text-sm">
                  {lignes.map((e) => (
                    <li key={`${e.motif}-${e.precision}`}>
                      {e.precision && (
                        <span className="text-grey-10">
                          {appLabels.repriseTecPrecision(e.precision)}{' '}
                        </span>
                      )}
                      <span className="text-grey-8">
                        {'· '}
                        {appLabels.repriseTecMotif(e.motif)}
                        {' · '}
                        {appLabels.repriseTecNombreLignes({ count: e.nombre })}
                      </span>
                      <RegleLink numero={e.section} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        }
      />
    </div>
  );
};
