import {CitationCollectiviteData} from 'app/types';

type CitationProps = {
  data: CitationCollectiviteData;
};

const Citation = ({data: {texte, auteur, description}}: CitationProps) => {
  return (
    <div className="w-full md:w-4/5 mx-auto bg-[#f5f5fe] p-8 mb-6 rounded-xl">
      <h2 className="text-center">Ils ont dit...</h2>
      <p className="text-center">« {texte} »</p>
      <p className="text-right font-bold mb-0">{auteur}</p>
      <p className="text-right italic mb-0">{description}</p>
    </div>
  );
};

export default Citation;
