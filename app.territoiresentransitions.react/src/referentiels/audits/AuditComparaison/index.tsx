import { useReferentielId } from '@/app/core-logic/hooks/params';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { defaultColors } from '@/app/ui/charts/chartsTheme';
import BarChartCardWithSubrows, {
  TBarChartScoreTable,
} from '@/app/ui/charts/old/BarChartCardWithSubrows';
import { AuditComparaisonTable } from './AuditComparaisonTable';
import { TScoreAuditRowData } from './types';
import { useExportAuditScores } from './useExportAuditScore';
import { useTableData } from './useTableData';
import { getFormattedScore } from './utils';

export const AuditComparaison = () => {
  const tableData = useTableData();

  const referentiel = useReferentielId();
  const collectivite = useCurrentCollectivite();
  const { mutate: exportAuditScores, isLoading } = useExportAuditScores(
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

      <BarChartCardWithSubrows
        pageName="app/audit/comparaison"
        referentiel={referentiel}
        score={tableData.table as TBarChartScoreTable}
        chartProps={{
          keys: ['Avant audit', 'Après audit'],
          groupMode: 'grouped',
        }}
        chartInfo={{
          title: 'Comparaison des scores "Réalisé"',
          legend: ['Avant audit', 'Après audit'].map((el, i) => ({
            name: el,
            color: defaultColors[i],
          })),
          legendOnOverview: true,
          expandable: true,
          downloadable: true,
          additionalInfo: true,
        }}
        customStyle={{ height: '550px', marginTop: '30px' }}
        getFormattedScore={(scoreData, indexBy, percentage) =>
          getFormattedScore(
            scoreData as readonly TScoreAuditRowData[],
            indexBy,
            percentage
          )
        }
      />
    </>
  );
};
