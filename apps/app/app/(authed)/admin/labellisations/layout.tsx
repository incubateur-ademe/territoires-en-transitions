import { LabellisationsAdminLayout } from '@/app/referentiels/labellisations-admin/labellisations-admin.layout';
import { makeBackofficeToolLayout } from '@/app/utils/backoffice/backoffice-tool.layout';
import { ReactNode } from 'react';

const BackofficeToolLayout = makeBackofficeToolLayout('labellisations');

/** En-tête et onglets gardés montés d'un onglet à l'autre. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <BackofficeToolLayout>
      <LabellisationsAdminLayout>{children}</LabellisationsAdminLayout>
    </BackofficeToolLayout>
  );
}
