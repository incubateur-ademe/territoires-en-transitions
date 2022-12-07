import {useTableData} from './useTableData';
import {AuditComparaisonTable} from './AuditComparaisonTable';

const AuditComparaison = () => {
  const tableData = useTableData();

  return <AuditComparaisonTable tableData={tableData} />;
};

export default AuditComparaison;
