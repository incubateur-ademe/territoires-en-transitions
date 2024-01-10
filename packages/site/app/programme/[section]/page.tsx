import Section from '@components/sections/Section';

type SectionProgrammeProps = {
  params: {section: string};
};

const SectionProgramme = ({params: {section}}: SectionProgrammeProps) => {
  return (
    <div>
      <Section containerClassName="even:bg-primary-1">
        <h1>Section</h1>
      </Section>
      <Section containerClassName="even:bg-primary-1">Test</Section>
    </div>
  );
};

export default SectionProgramme;
