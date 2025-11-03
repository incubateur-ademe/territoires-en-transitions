import Image from 'next/image';

const TerritoireEngageLogo = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <Image
        src="/territoire-engage.jpg"
        alt="Territoire Engagé Transition Écologique"
        width={80}
        height={80}
        style={{ height: '100%', width: 'auto' }}
      />
    </div>
  );
};

export default TerritoireEngageLogo;

