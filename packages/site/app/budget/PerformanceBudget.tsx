import Image from 'next/image';

type PerformanceBudgetProps = {
  titre: string;
  titre_edl: string;
  titre_fa: string;
};

const PerformanceBudget = ({
  titre,
  titre_edl,
  titre_fa,
}: PerformanceBudgetProps) => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9">{titre}</h2>

      <h5>{titre_edl}</h5>
      <Image
        src="/budget/Graph2.png"
        alt={titre_edl}
        width={861}
        height={391}
        className="mt-10 mb-20"
      />

      <h5>{titre_fa}</h5>
      <Image
        src="/budget/Graph3.png"
        alt={titre_fa}
        width={839}
        height={383}
        className="mt-10"
      />
    </div>
  );
};

export default PerformanceBudget;
