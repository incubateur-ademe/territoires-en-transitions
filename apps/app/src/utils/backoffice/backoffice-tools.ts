import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  importerPlanUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';

export type BackofficeTool = {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
};

export const backofficeTools: BackofficeTool[] = [
  {
    id: 'importer-plan',
    label: appLabels.importerUnPlan,
    description: appLabels.administrationImporterPlanDescription,
    icon: 'file-excel-2-line',
    href: importerPlanUrl,
  },
  {
    id: 'ajouter-collectivite',
    label: appLabels.ajouterCollectivite,
    description: appLabels.administrationAjouterCollectiviteDescription,
    icon: 'community-line',
    href: ajouterCollectiviteUrl,
  },
  {
    id: 'banniere',
    label: appLabels.banniere,
    description: appLabels.administrationBanniereDescription,
    icon: 'megaphone-line',
    href: bannerInfoUrl,
  },
];
