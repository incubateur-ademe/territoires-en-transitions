import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';

type EquipeListeProps = {
  liste: {
    id: number;
    titre: string;
    legende: string;
    image: StrapiItem;
  }[];
};

const EquipeListe = ({liste}: EquipeListeProps) => {
  return (
    <>
      {liste.map(l => (
        <div
          key={l.id}
          className="w-[169px] h-[204px] border border-primary-5 rounded-[10px] flex flex-col items-center justify-start gap-4 py-4 px-2"
        >
          <StrapiImage
            data={l.image}
            className="rounded-full w-[83px] h-[83px] min-w-[83px] min-h-[83px] object-cover border border-primary-4"
          />
          <div className="flex flex-col gap-1">
            <p className="text-primary-9 text-[14px] text-center leading-[19px] font-[500] mb-0">
              {l.titre}
            </p>
            <p className="text-primary-6 text-[12px] text-center leading-[16px] font-[500] mb-0">
              {l.legende}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};

export default EquipeListe;
