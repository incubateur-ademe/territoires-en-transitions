import PictoBackground from './PictoBackground';

const PictoWithBackground = ({pictogram}: {pictogram: React.ReactNode}) => {
  return (
    <div className="relative">
      <PictoBackground />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
        {pictogram}
      </div>
    </div>
  );
};

export default PictoWithBackground;
