import Image from 'next/image';

export type RepartitionCoutsProps = {
  titre: string;
};

const RepartitionCouts = ({titre}: RepartitionCoutsProps) => {
  return (
    <>
      <h5>{titre}</h5>
      <Image
        src="/budget/graph1.png"
        alt={titre}
        width={827}
        height={427}
        className="my-20"
      />
    </>
  );
};

export default RepartitionCouts;
