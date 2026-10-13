'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import { useListCasTypes } from '../data/use-list-cas-types';
import { RecetteChargement } from '../recette.chargement';
import { RegleLink } from '../regles/regle.link';
import { CasType } from './cas-type';

const REPRIS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];

export const CasTypesView = () => {
  const { data, isLoading, error } = useListCasTypes();
  return (
    <div
      className="flex flex-col gap-6"
      data-test="admin.reprise-tec.cas-types"
    >
      <PageHeader className="mb-0">
        <PageHeader.Title>{appLabels.repriseTecCasTypes}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.repriseTecCasTypesSousTitre}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      <RecetteChargement
        isLoading={isLoading}
        isPreconditionFailed={error?.data?.code === 'PRECONDITION_FAILED'}
      >
        {data && (
          <>
            {[
              {
                titre: appLabels.repriseTecCasTypesRepris,
                liste: data.casTypes.filter((c) => REPRIS.includes(c.code)),
              },
              {
                titre: appLabels.repriseTecCasTypesNonRepris,
                liste: data.casTypes.filter((c) => !REPRIS.includes(c.code)),
              },
            ].map(({ titre, liste }) => (
              <section key={titre} className="flex flex-col gap-3">
                <h2 className="mb-0 text-lg text-primary-9">{titre}</h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {liste.map((c) => (
                    <CasType key={c.code} casType={c} />
                  ))}
                </div>
              </section>
            ))}
            <section className="flex flex-col gap-3">
              <h2 className="mb-0 text-lg text-primary-9">
                {appLabels.repriseTecParticularites}
              </h2>
              <p className="mb-0 text-sm text-grey-8">
                {appLabels.repriseTecParticularitesSousTitre}
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {data.particularites.map((p) => (
                  <li
                    key={p.code}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-grey-3 bg-white px-4 py-3 text-sm"
                  >
                    <span className="text-xs font-bold text-grey-7">
                      {p.code}
                    </span>
                    <span className="text-primary-10">
                      {appLabels.repriseTecParticularite(p.code)}
                    </span>
                    <span className="font-bold">
                      {appLabels.repriseTecNombreDossiers({ count: p.nombre })}
                    </span>
                    {p.sections.map((numero) => (
                      <RegleLink key={numero} numero={numero} />
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </RecetteChargement>
    </div>
  );
};
