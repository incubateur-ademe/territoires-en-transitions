import {useTableData} from './useTableData';
import {AuditComparaisonTable} from './AuditComparaisonTable';
import {useReferentielId} from 'core-logic/hooks/params';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useExportAuditScores} from './export/useExportAuditScore';

const AuditComparaison = () => {
  const tableData = useTableData();

  const referentiel = useReferentielId();
  const collectivite = useCurrentCollectivite();
  const {exportAuditScores, isLoading} = useExportAuditScores(
    referentiel,
    collectivite
  );

  return (
    <>
      <AuditComparaisonTable tableData={tableData} />
      <button
        data-test="export-audit-comp"
        className="fr-btn fr-btn--icon-left fr-fi-download-line"
        disabled={isLoading}
        onClick={() => {
          exportAuditScores();
        }}
      >
        Exporter
      </button>
    </>
  );
};

export default AuditComparaison;
