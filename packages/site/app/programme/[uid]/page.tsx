import {getServiceStrapiData} from './utils';
import IntroductionService from './IntroductionService';
import {BeneficesData, IntroductionData} from './types';
import BeneficesService from './BeneficesService';

type ServiceProgrammeProps = {
  params: {uid: string};
};

const ServiceProgramme = async ({params: {uid}}: ServiceProgrammeProps) => {
  const data = await getServiceStrapiData(uid);

  if (!data || data.contenu.length === 0) return null;

  return (
    <>
      {data.contenu.map(c => {
        switch (c.type) {
          case 'introduction':
            return <IntroductionService {...(c as IntroductionData)} />;
          case 'benefices':
            return <BeneficesService liste={(c as BeneficesData).liste} />;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ServiceProgramme;
