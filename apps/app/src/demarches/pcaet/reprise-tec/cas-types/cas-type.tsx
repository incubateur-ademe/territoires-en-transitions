'use client';

import { makeRepriseTecCollectiviteUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge, Button } from '@tet/ui';
import Link from 'next/link';
import { useState } from 'react';
import type { CasTypes } from '../data/use-list-cas-types';
import { RegleLink } from '../regles/regle.link';

type CasTypeData = CasTypes['casTypes'][number];

const urlDuDossier = (d: CasTypeData['dossiers'][number]) =>
  d.collectiviteId === null
    ? null
    : makeRepriseTecCollectiviteUrl({
        collectiviteId: d.collectiviteId,
        tecDossierId: d.tecDossierId,
      });

export const CasType = ({ casType }: { casType: CasTypeData }) => {
  const [ouvert, setOuvert] = useState(false);
  const exemple = casType.exemple
    ? urlDuDossier({ ...casType.exemple, particularites: [] })
    : null;
  return (
    <div
      id={casType.code}
      className="flex flex-col gap-3 rounded-lg border border-grey-3 bg-white p-4"
      data-test={`admin.reprise-tec.cas-type-${casType.code}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-grey-7">{casType.code}</span>
          <span className="font-bold text-primary-9">
            {appLabels.repriseTecCasType(casType.code)}
          </span>
        </div>
        <Badge
          size="sm"
          variant="grey"
          title={appLabels.repriseTecNombreDossiers({ count: casType.nombre })}
        />
      </div>
      <span className="text-xs font-medium text-grey-8">
        {appLabels.repriseTecCasTypeChemin(casType.code)}
        {casType.sections.map((numero) => (
          <RegleLink key={numero} numero={numero} />
        ))}
      </span>
      <p className="mb-0 text-sm text-grey-9">
        {appLabels.repriseTecCasTypeDetail(casType.code)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {exemple && (
          <Button size="xs" href={exemple}>
            {appLabels.repriseTecOuvrirExemple}
          </Button>
        )}
        {casType.nombre > 0 && (
          <Button
            size="xs"
            variant="outlined"
            onClick={() => setOuvert(!ouvert)}
          >
            {ouvert
              ? appLabels.repriseTecMasquerListe
              : appLabels.repriseTecVoirTous(casType.nombre)}
          </Button>
        )}
      </div>
      {casType.exemple && (
        <span className="text-xs text-grey-8">
          {casType.exemple.collectiviteNom}
        </span>
      )}
      {ouvert && (
        <ul className="m-0 flex max-h-64 list-none flex-col gap-1 overflow-y-auto border-t border-grey-3 p-0 pt-2 text-sm">
          {casType.dossiers.map((d) => {
            const url = urlDuDossier(d);
            return (
              <li
                key={d.tecDossierId}
                className="flex flex-wrap items-center gap-2"
              >
                {url ? (
                  <Link href={url} className="text-primary-9 hover:underline">
                    {d.collectiviteNom}
                  </Link>
                ) : (
                  <span className="text-grey-8">{d.collectiviteNom}</span>
                )}
                <span className="text-xs text-grey-7">
                  {appLabels.repriseTecIdTecOnglet(d.tecDossierId)}
                </span>
                {d.particularites.map((p) => (
                  <Badge key={p} size="xs" variant="warning" title={p} />
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
