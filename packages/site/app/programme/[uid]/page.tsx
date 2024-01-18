import {getServiceStrapiData} from './utils';
import IntroductionService from './IntroductionService';
import {
  BeneficesData,
  IntroductionData,
  ListeCartesData,
  ListeData,
  ParagrapheData,
} from './types';
import BeneficesService from './BeneficesService';
import ParagrapheService from './ParagrapheService';
import ListeService from './ListeService';
import ListeCartesService from './ListeCartesService';

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
          case 'paragraphe':
            return <ParagrapheService {...(c as ParagrapheData)} />;
          case 'benefices':
            return <BeneficesService liste={(c as BeneficesData).liste} />;
          case 'liste':
            return <ListeService {...(c as ListeData)} />;
          case 'listeCartes':
            return <ListeCartesService {...(c as ListeCartesData)} />;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ServiceProgramme;
