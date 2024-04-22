import {useTableData} from './useTableData';
import {AuditComparaisonTable} from './AuditComparaisonTable';
import {useReferentielId} from 'core-logic/hooks/params';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useExportAuditScores} from './useExportAuditScore';
import BarChartCardWithSubrows, {
  TBarChartScoreTable,
} from 'ui/charts/old/BarChartCardWithSubrows';
import {defaultColors} from 'ui/charts/chartsTheme';
import {getFormattedScore} from './utils';
import {TScoreAuditRowData} from './types';
import {ReferentielParamOption} from 'app/paths';

const AuditComparaison = () => {
  const tableData = useTableData();

  const referentiel = useReferentielId() as ReferentielParamOption;
  const collectivite = useCurrentCollectivite();
  const {mutate: exportAuditScores, isLoading} = useExportAuditScores(
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
        customStyle={{height: '550px', marginTop: '30px'}}
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

export default AuditComparaison;
