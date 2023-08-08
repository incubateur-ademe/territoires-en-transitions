type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  customBackground?: string;
};

const Section = ({
  id,
  children,
  className = '',
  customBackground,
}: SectionProps): JSX.Element => (
  <section
    id={id}
    className="section fr-py-7w"
    style={{backgroundColor: customBackground}}
  >
    <div className={`fr-container flex gap-4 ${className}`}>{children}</div>
  </section>
);

export default Section;
