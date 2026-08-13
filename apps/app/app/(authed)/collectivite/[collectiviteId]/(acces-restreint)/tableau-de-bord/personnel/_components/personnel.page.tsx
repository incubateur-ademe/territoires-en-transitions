'use client';

import { appLabels } from '@/app/labels/catalog';
import { useUser } from '@tet/api';
import { PageHeader } from '@tet/ui';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  const { prenom } = useUser();

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{`${appLabels.bonjour} ${prenom}`}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="text-lg text-grey-8 mb-2">
            {appLabels.suiviPersonnelDescription}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      <div className="flex flex-col gap-8 mt-8">
        <Metrics />
        <Modules />
      </div>
    </>
  );
};

export default PersonnelPage;
