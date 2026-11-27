'use client';

import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { appLabels } from '@/app/labels/catalog';
import { downloadElementAsImage } from '@/app/utils/download-element-as-image';
import { ButtonMenu } from '@tet/ui';
import { RefObject } from 'react';

/** Le menu « trois points » d'une carte : son Excel et son graphique en PNG */
export const IndicateurObjectifMenu = ({
  indicateurId,
  titre,
  cardRef,
}: {
  indicateurId: number;
  titre: string;
  cardRef: RefObject<HTMLElement | null>;
}) => {
  const { mutate: exportExcel, isPending } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [indicateurId],
  });

  return (
    <ButtonMenu
      icon="more-line"
      variant="grey"
      size="xs"
      title={appLabels.indicateurOptions}
      dataTest="plans.suivi.indicateurs-objectifs.carte.menu"
      menu={{
        placement: 'bottom-end',
        className: 'max-w-none whitespace-nowrap',
        actions: [
          {
            label: appLabels.telechargerLeGraphiquePng,
            icon: 'image-line',
            onClick: () => {
              if (cardRef.current) {
                downloadElementAsImage(cardRef.current, titre, 'png');
              }
            },
          },
          {
            label: appLabels.indicateurTelechargerExcel,
            icon: 'file-excel-line',
            disabled: isPending,
            onClick: () => exportExcel(),
          },
        ],
      }}
    />
  );
};
