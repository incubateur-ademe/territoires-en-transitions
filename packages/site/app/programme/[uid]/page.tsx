import {getServiceStrapiData} from './utils';
import {ListeData, ParagrapheData} from './types';
import ParagrapheService from './ParagrapheService';
import ListeService from './ListeService';

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
          case 'paragraphe':
            return <ParagrapheService {...(c as ParagrapheData)} />;
          case 'liste':
            return <ListeService {...(c as ListeData)} />;
          default:
            return null;
        }
      })}
    </>
  );
};

export default ServiceProgramme;
