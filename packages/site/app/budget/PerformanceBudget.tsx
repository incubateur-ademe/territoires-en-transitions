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
    <div className="bg-white md:rounded-xl py-8 md:py-12 px-6 md:px-10 flex flex-col gap-12">
      <h2 className="text-primary-9 mb-0">{titre}</h2>

      <div>
        <h5 className="text-primary text-lg">{titre_edl}</h5>
        <Image
          src="/budget/graph2.png"
          alt={titre_edl}
          width={861}
          height={391}
        />
      </div>

      <div>
        <h5 className="text-primary text-lg">{titre_fa}</h5>
        <Image
          src="/budget/graph3.png"
          alt={titre_fa}
          width={839}
          height={383}
        />
      </div>
    </div>
  );
};

export default PerformanceBudget;
