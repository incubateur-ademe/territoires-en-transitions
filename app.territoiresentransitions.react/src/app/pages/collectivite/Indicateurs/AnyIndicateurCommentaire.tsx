import Textarea from 'ui/shared/form/Textarea';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

export const AnyIndicateurCommentaire = ({
  handleSave,
  value,
}: {
  handleSave: (event: React.FormEvent<HTMLTextAreaElement>) => void;
  value: string;
}) => {
  const collectivite = useCurrentCollectivite();

  return collectivite ? (
    <>
      <label className="fr-label" htmlFor="file-upload">
        Précisions sur l'indicateur
        <p className="fr-hint-text">
          Renseignez ici les informations que vous souhaitez préciser vis-à-vis
          de l'indicateur. Analyse de la tendance d'évolution, éléments de
          contexte sur l'évolution des valeurs, sources, etc.
        </p>
      </label>
      <Textarea
        defaultValue={value}
        onBlur={handleSave}
        disabled={collectivite.readonly}
      />
    </>
  ) : null;
};
