import { appLabels } from '@/app/labels/catalog';
import { downloadElementAsImage } from '@/app/utils/download-element-as-image';
import { ButtonMenu } from '@tet/ui';
import { RefObject } from 'react';

export const ExportBlocButton = ({
  blocRef,
  fileName,
  onExportExcel,
  isExportingExcel,
  dataTest,
}: {
  blocRef: RefObject<HTMLElement | null>;
  fileName: string;
  onExportExcel: () => void;
  isExportingExcel: boolean;
  dataTest?: string;
}) => (
  <ButtonMenu
    icon="download-line"
    variant="outlined"
    size="sm"
    title={appLabels.suiviPlanExporterBloc}
    dataTest={dataTest}
    menu={{
      placement: 'bottom-end',
      className: 'max-w-none whitespace-nowrap',
      actions: [
        {
          label: appLabels.telechargerLeGraphiquePng,
          icon: 'image-line',
          onClick: () => {
            if (blocRef.current) {
              downloadElementAsImage(blocRef.current, fileName, 'png');
            }
          },
        },
        {
          label: appLabels.suiviPlanExporterExcel,
          icon: 'file-excel-line',
          disabled: isExportingExcel,
          tooltip: isExportingExcel ? appLabels.exportEnCours : undefined,
          onClick: onExportExcel,
        },
      ],
    }}
  />
);
