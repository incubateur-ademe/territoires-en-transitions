import {Table, THead, TBody, TRow, THeadCell, TCell, Input} from '@tet/ui';
import {
  IndicateurTrajectoire,
  SEQUESTRATION_CARBONE,
  SourceIndicateur,
} from '../constants';
import classNames from 'classnames';

type TableauDonneesProps = {
  /** secteurs à afficher dans le tableau */
  indicateur: IndicateurTrajectoire | typeof SEQUESTRATION_CARBONE;
  /** données sectorielles */
  valeursSecteurs: {
    identifiant: string;
    valeurs: {source: string; valeur: number}[];
  }[];
  /** sources des données */
  sources: {id: string; nom: string}[];
  /** appelé lorsqu'un champ a été modifié */
  onChange: (args: {identifiant: string; valeur: number | null}) => void;
};

/**
 * Affiche un tableau regroupant les valeurs open data et celles de la
 * collectivité. Ces dernières sont éditables.
 */
export const TableauDonnees = ({
  indicateur,
  valeursSecteurs,
  sources,
  onChange,
}: TableauDonneesProps) => {
  return (
    <Table className="mt-7">
      <THead>
        <TRow>
          <THeadCell className="text-left uppercase">Secteur</THeadCell>
          {sources.map(source => (
            <THeadCell
              key={source.id}
              className={classNames('w-1/5', {
                uppercase: source.id !== 'collectivite',
              })}
            >
              {source.nom}
            </THeadCell>
          ))}
        </TRow>
      </THead>
      <TBody>
        {indicateur.secteurs.map(secteur => {
          const valeurs = valeursSecteurs?.find(
            ({identifiant}) => identifiant === secteur.identifiant
          )?.valeurs;
          return (
            <TRow key={secteur.identifiant}>
              <TCell variant="title">{secteur.nom}</TCell>
              {sources.map(source => {
                const sourceCollectivite =
                  source.id === SourceIndicateur.COLLECTIVITE;
                const val = valeurs
                  ?.find(v => v.source === source.id)
                  ?.valeur?.toString();
                return (
                  <TCell
                    key={source.id}
                    variant={sourceCollectivite ? 'input' : 'number'}
                  >
                    {sourceCollectivite ? (
                      <Input
                        type="number"
                        numType="float"
                        value={val}
                        onValueChange={evt =>
                          onChange?.({
                            identifiant: secteur.identifiant,
                            valeur: evt.floatValue ?? null,
                          })
                        }
                      />
                    ) : (
                      val ?? '--'
                    )}
                  </TCell>
                );
              })}
            </TRow>
          );
        })}
      </TBody>
    </Table>
  );
};
