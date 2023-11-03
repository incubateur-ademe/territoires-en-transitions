import Gallery from '@components/gallery/Gallery';
import {Indicateurs} from 'app/collectivite/utils';
import {StrapiItem} from 'src/strapi/StrapiItem';
import IndicateurCard from './IndicateurCard';

export type IndicateurDefaultData = {
  titre: string;
  description: string;
  titre_encadre: string;
  description_encadre: string;
  illustration_encadre: StrapiItem;
};

type IndicateursCollectiviteProps = {
  defaultData: {
    gaz_effet_serre?: IndicateurDefaultData;
  };
  indicateurs: {
    gaz_effet_serre: Indicateurs[];
  };
};

const IndicateursCollectivite = ({
  defaultData,
  indicateurs,
}: IndicateursCollectiviteProps) => {
  return (
    <Gallery
      className="col-span-full md:col-span-7 lg:col-span-8"
      maxCols={2}
      breakpoints={{md: 768, lg: 1024}}
      gap="gap-0 md:gap-10 xl:gap-12"
      data={[
        <IndicateurCard
          key="gaz_effet_serre"
          defaultData={defaultData.gaz_effet_serre}
          data={indicateurs.gaz_effet_serre}
          graphTitle="Répartition des émissions de gaz à effet de serre (hors puits) par secteur"
          unit="t CO₂eq"
          unitSingular={true}
        />,
      ]}
    />
  );
};

export default IndicateursCollectivite;
