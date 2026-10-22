'use client';

import { makeDemandesAvisUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { PageHeader, Select } from '@tet/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { JSX } from 'react';
import { useListReferentsOrganismes } from './data/use-list-referents-organismes';
import { useListReferentsRegions } from './data/use-list-referents-regions';
import { useReferentsAccess } from './data/use-referents-access';
import { OrganismeReferentsCard } from './organisme-referents.card';

const SECTIONS = [
  {
    type: collectiviteTypeEnum.DREAL,
    titre: appLabels.referentsPcaetSectionDreal,
  },
  {
    type: collectiviteTypeEnum.REGION,
    titre: appLabels.referentsPcaetSectionRegion,
  },
  { type: collectiviteTypeEnum.DDT, titre: appLabels.referentsPcaetSectionDdt },
];

export const ReferentsPcaetPage = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): JSX.Element => {
  const access = useReferentsAccess({ collectiviteId });
  const { regions } = useListReferentsRegions({
    collectiviteId,
    enabled: access.canRead,
  });
  const [regionCode, setRegionCode] = useQueryState('region', parseAsString);
  const { organismes, isLoading } = useListReferentsOrganismes({
    collectiviteId,
    regionCode,
    enabled: access.canRead,
  });

  if (access.isLoading) {
    return <SpinnerLoader className="m-auto" />;
  }
  if (!access.canRead) {
    return (
      <ErreurAccesPage
        dashboardHref={makeDemandesAvisUrl({ collectiviteId })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader>
        <PageHeader.Title>{appLabels.referentsPcaetTitre}</PageHeader.Title>
        <PageHeader.Subtitle>
          {appLabels.referentsPcaetDescription}
        </PageHeader.Subtitle>
      </PageHeader>

      <div className="w-full max-w-sm">
        <Select
          dataTest="demarches.referents-pcaet.region"
          options={regions.map(({ code, libelle }) => ({
            value: code,
            label: libelle,
          }))}
          values={regionCode ?? undefined}
          onChange={(code) => setRegionCode(code ? String(code) : null)}
          isSearcheable
          placeholder={appLabels.referentsPcaetChoisirRegion}
        />
      </div>

      {!regionCode && (
        <p className="text-grey-7">
          {appLabels.referentsPcaetChoisirRegionAide}
        </p>
      )}
      {regionCode && isLoading && <SpinnerLoader className="m-auto" />}
      {regionCode &&
        !isLoading &&
        SECTIONS.map(({ type, titre }) => {
          const organismesDuType = organismes.filter(
            ({ organisme }) => organisme.type === type
          );
          if (organismesDuType.length === 0) {
            return null;
          }
          return (
            <section key={type} className="flex flex-col gap-4">
              <h2 className="mb-0 text-xl">{titre}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {organismesDuType.map((organisme) => (
                  <OrganismeReferentsCard
                    key={organisme.organisme.id}
                    {...organisme}
                    collectiviteId={collectiviteId}
                    canMutate={access.canMutate}
                  />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
};
