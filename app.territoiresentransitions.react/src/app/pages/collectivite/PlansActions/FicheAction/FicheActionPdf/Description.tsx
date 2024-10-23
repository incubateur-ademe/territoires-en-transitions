import { twToCss } from 'ui/exportPdf/utils';
import Card from 'ui/exportPdf/components/Card';
import { FicheActionPdfProps } from './FicheActionPdf';

const Description = ({ fiche }: FicheActionPdfProps) => {
  const { thematiques, sousThematiques, description, ressources } = fiche;

  return (
    <Card className="bg-primary-6 border-primary-6 mb-4">
      {/* Liste des thématiques et sous-thématiques sous forme de badges */}
      {(thematiques?.length || sousThematiques?.length) && (
        <p style={twToCss('mt-0 mb-4 text-xs font-bold text-info-2')}>
          {[
            ...(thematiques ?? []).map((t) => t.nom),
            ...(sousThematiques ?? []).map((st) => st.sousThematique),
          ].join(', ')}
        </p>
      )}

      {/* Description */}
      <div style={twToCss('mb-3')}>
        <h6 style={twToCss('text-sm text-grey-1 mt-0 mb-1.5')}>
          Description de l'action :
        </h6>
        <p style={twToCss('text-xs leading-6 text-grey-1 my-0')}>
          {description ?? 'Non renseigné'}
        </p>
      </div>

      {/* Moyens humains et technqiues */}
      <div>
        <h6 style={twToCss('text-sm text-grey-1 mt-0 mb-1.5')}>
          Moyens humains et techniques :
        </h6>
        <p style={twToCss('text-xs leading-6 text-grey-1 my-0')}>
          {ressources ?? 'Non renseigné'}
        </p>
      </div>
    </Card>
  );
};

export default Description;
