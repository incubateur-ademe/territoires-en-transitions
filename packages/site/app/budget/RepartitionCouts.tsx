import Image from 'next/image';

const RepartitionCouts = () => {
  return (
    <>
      <h5 className="mb-10">
        Répartition des coûts totaux par catégorie de dépenses
      </h5>
      <Image
        src="/budget/graph1.png"
        alt="Répartition des coûts totaux par catégorie de dépenses"
        width={827}
        height={427}
        className="my-20"
      />
    </>
  );
};

export default RepartitionCouts;
