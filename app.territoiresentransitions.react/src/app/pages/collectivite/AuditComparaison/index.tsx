import {useTableData} from './useTableData';
import {AuditComparaisonTable} from './AuditComparaisonTable';
import {useReferentielId} from 'core-logic/hooks/params';
import {useDownloadComparaisonScoreAuditAsCSV} from './useDownloadComparaisonScoreAuditAsCSV';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

const AuditComparaison = () => {
  const tableData = useTableData();

  const referentiel = useReferentielId();
  const collectivite = useCurrentCollectivite();
  const {download, disabled} = useDownloadComparaisonScoreAuditAsCSV(
    collectivite,
    referentiel
  );

  return (
    <>
      <AuditComparaisonTable tableData={tableData} />
      <button
        data-test="export-audit-comp"
        className="fr-btn fr-btn--icon-left fr-fi-download-line"
        disabled={disabled}
        onClick={() => {
          download();
        }}
      >
        Exporter
      </button>
    </>
  );
};

export default AuditComparaison;
