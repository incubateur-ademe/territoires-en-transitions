import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import { SiteIndicateurArtificialisation } from '@/site/src/trpc/trpc-client';
import IndicateurArtificialisationSols from './IndicateurArtificialisationSols';
import type { Indicateur, Indicateurs } from '../../utils';
import IndicateurGazEffetSerre from './IndicateurGazEffetSerre';

export type IndicateurDefaultData = Indicateur;

type IndicateursCollectiviteProps = {
  defaultData: {
    artificialisation_sols?: IndicateurDefaultData;
    gaz_effet_serre?: IndicateurDefaultData;
  };
  indicateurs: {
    artificialisation_sols: SiteIndicateurArtificialisation | null;
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
