import {useTableData} from './useTableData';
import {DetailTacheTable} from './DetailTacheTable';

export default () => {
  const tableData = useTableData();

  const handleUpdateStatut = () => {
    console.log('TODO');
  };

  return (
    <DetailTacheTable
      tableData={tableData}
      updateActionStatut={handleUpdateStatut}
    />
  );
};
