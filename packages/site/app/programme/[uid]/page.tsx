import Section from '@components/sections/Section';
import {getServiceStrapiData} from '../utils';

type ServiceProgrammeProps = {
  params: {uid: string};
};

const ServiceProgramme = async ({params: {uid}}: ServiceProgrammeProps) => {
  const data = await getServiceStrapiData(uid);

  return (
    <div>
      <Section containerClassName="even:bg-primary-1">
        <h1>Section</h1>
      </Section>
      <Section containerClassName="even:bg-primary-1">Test</Section>
    </div>
  );
};

export default ServiceProgramme;
