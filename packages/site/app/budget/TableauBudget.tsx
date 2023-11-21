const TableauBudget = () => {
  return (
    <table className="w-full border border-primary-3 text-primary-10 text-[12px] leading-[15px] font-[500] my-10">
      <tr className="h-[36px] bg-primary-2 border border-primary-3">
        <th className="w-1/5 border border-primary-3 text-left p-3"></th>
        <th className="w-1/5 border border-primary-3 text-left p-3">2021</th>
        <th className="w-1/5 border border-primary-3 text-left p-3">2022</th>
        <th className="w-1/5 border border-primary-3 text-left p-3">2023</th>
        <th className="w-1/5 bg-primary-4 border border-primary-3 text-left p-3">
          Prévisionnel S1 2024
        </th>
      </tr>
      <tr className="h-[36px] border border-primary-3">
        <td className="border border-primary-3 text-primary-9 p-3">
          Développement
        </td>
        <td className="border border-primary-3 p-3">392 604 €</td>
        <td className="border border-primary-3 p-3">519 590 €</td>
        <td className="border border-primary-3 p-3">893 693 €</td>
        <td className="bg-primary-0 border border-primary-3 p-3">400 000 €</td>
      </tr>
      <tr className="h-[36px] bg-primary-0 border border-primary-3">
        <td className="border border-primary-3 text-primary-9 p-3">
          Total TTC
        </td>
        <td className="border border-primary-3 font-bold p-3">598 405 €</td>
        <td className="border border-primary-3 font-bold p-3">812 486 €</td>
        <td className="border border-primary-3 font-bold p-3">1 457 988 €</td>
        <td className="bg-primary-0 border border-primary-3 font-bold p-3">
          820 000 €
        </td>
      </tr>
    </table>
  );
};

export default TableauBudget;
