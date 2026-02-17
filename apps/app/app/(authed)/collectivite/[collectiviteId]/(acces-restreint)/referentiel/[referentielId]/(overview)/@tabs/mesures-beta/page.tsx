'use client';

import { MesuresBetaTable } from './mesures-beta.table';
import { useMesuresBetaTableData } from './use-mesures-beta-table-data';

export default function MesuresBetaPage() {
  const tableData = useMesuresBetaTableData();

  return (
    <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Vue tabulaire édition rapide (beta)
        </h2>
        <p className="text-sm text-grey-7 mb-6">
          Éditez rapidement le statut, consultez les documents et commentaires
          de chaque mesure. Les documents et commentaires s&apos;ouvrent dans le
          panneau latéral.
        </p>
        <MesuresBetaTable
          data={tableData.data}
          isLoading={tableData.isLoading}
          isSaving={tableData.isSaving}
          updateStatut={tableData.updateStatut}
          referentielId={tableData.referentielId}
        />
      </div>
  );
}
