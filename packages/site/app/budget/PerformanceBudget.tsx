import Image from 'next/image';

const PerformanceBudget = () => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9 mb-10">
        Performance du budget rapporté aux statistiques d’usage du service
      </h2>

      <h5 className="mb-10">
        Budget global rapporté aux nombre d’états des lieux réalisés
      </h5>
      <Image
        src="/budget/Graph2.png"
        alt="Budget global rapporté aux nombre d’états des lieux réalisés"
        width={861}
        height={391}
        className="my-20"
      />

      <h5 className="mb-10">
        Evolution du budget global rapporté au nombre de fiches actions
      </h5>
      <Image
        src="/budget/Graph3.png"
        alt="Evolution du budget global rapporté au nombre de fiches actions"
        width={839}
        height={383}
        className="mt-20"
      />
    </div>
  );
};

export default PerformanceBudget;
