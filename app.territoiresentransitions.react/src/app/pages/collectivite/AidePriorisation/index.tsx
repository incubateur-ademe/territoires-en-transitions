import {useTableData} from './useTableData';
import {Table} from './Table';

export default () => {
  const tableData = useTableData();

  return (
    <>
      <Table tableData={tableData} />
    </>
  );
};
