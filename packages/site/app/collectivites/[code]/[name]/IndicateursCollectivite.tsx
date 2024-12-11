import {
  IndicateurArtificialisation,
  Indicateurs,
} from '@/site/app/collectivites/utils';
import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import IndicateurArtificialisationSols from './IndicateurArtificialisationSols';
import IndicateurGazEffetSerre from './IndicateurGazEffetSerre';

export type IndicateurDefaultData = {
  titre: string;
  description: string;
  titre_encadre: string;
  description_encadre: string;
  illustration_encadre: StrapiItem;
  details?: string;
};

type IndicateursCollectiviteProps = {
  defaultData: {
    artificialisation_sols?: IndicateurDefaultData;
    gaz_effet_serre?: IndicateurDefaultData;
  };
  indicateurs: {
    artificialisation_sols: IndicateurArtificialisation | null;
    gaz_effet_serre: Indicateurs[] | null;
  };
};

const IndicateursCollectivite = ({
  defaultData,
  indicateurs,
}: IndicateursCollectiviteProps) => {
  return (
    <MasonryGallery
      className="col-span-full md:col-span-7 lg:col-span-8"
      maxCols={2}
      breakpoints={{ md: 768, lg: 1024 }}
      gap="gap-0 md:gap-10 xl:gap-12"
      data={[
        <IndicateurArtificialisationSols
          key="artificialisation_sols"
          defaultData={defaultData.artificialisation_sols}
          data={indicateurs.artificialisation_sols}
        />,
        <IndicateurGazEffetSerre
          key="gaz_effet_serre"
          defaultData={defaultData.gaz_effet_serre}
          data={indicateurs.gaz_effet_serre}
        />,
      ]}
    />
  );
};

export default IndicateursCollectivite;
