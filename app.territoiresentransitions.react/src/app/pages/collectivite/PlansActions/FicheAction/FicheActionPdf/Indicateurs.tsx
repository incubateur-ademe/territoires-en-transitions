import classNames from 'classnames';
import { FicheAction } from '@tet/api/plan-actions';
import { IndicateurDefinition } from '@tet/api/indicateurs/domain';
import {
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from 'ui/exportPdf/components';

type IndicateurCardProps = {
  indicateur: IndicateurDefinition;
};

const IndicateurCard = ({ indicateur }: IndicateurCardProps) => {
  const { titre, unite, rempli, participationScore } = indicateur;

  return (
    <Card wrap={false} gap={1.5} className="w-[48%] p-3">
      <Title variant="h6" className="leading-5">
        {titre}
        <Paragraph className="text-grey-6 font-normal"> ({unite})</Paragraph>
      </Title>
      <Paragraph className="uppercase">
        {rempli ? 'Complété' : 'À compléter'}
      </Paragraph>
      {participationScore && (
        <Stack gap={1} className="mt-auto">
          <Divider className="h-[0.5px]" />
          <Paragraph className="text-[0.65rem] text-grey-8">
            Participe au score Climat Air Énergie
          </Paragraph>
        </Stack>
      )}
    </Card>
  );
};

type IndicateursProps = {
  fiche: FicheAction;
  indicateursListe: IndicateurDefinition[] | undefined | null;
};

const Indicateurs = ({ fiche, indicateursListe }: IndicateursProps) => {
  const { objectifs, resultatsAttendus: effetsAttendus } = fiche;

  const emptyObjectifs = !objectifs || objectifs.length === 0;
  const emptyEffetsAttendus = !effetsAttendus || effetsAttendus.length === 0;

  if (
    emptyObjectifs &&
    emptyEffetsAttendus &&
    (!indicateursListe || indicateursListe.length === 0)
  )
    return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Indicateurs de suivi
      </Title>

      {/* Objectifs */}
      <Paragraph
        className={classNames({
          'text-grey-7': emptyObjectifs,
        })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Objectifs :{' '}
        </Paragraph>
        {!emptyObjectifs ? objectifs : 'Non renseignés'}
      </Paragraph>

      {/* Effets attendus */}
      <Paragraph
        className={classNames({
          'text-grey-7': emptyEffetsAttendus,
        })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Effets attendus :{' '}
        </Paragraph>
        {!emptyEffetsAttendus
          ? effetsAttendus.map((res) => res.nom).join(', ')
          : 'Non renseignés'}
      </Paragraph>

      {/* Liste des indicateurs */}
      {indicateursListe && indicateursListe.length > 0 && (
        <>
          <Paragraph className="text-primary-9 font-bold uppercase">
            Indicateurs associés :
          </Paragraph>
          <Stack direction="row" className="flex-wrap">
            {indicateursListe.map((indicateur) => (
              <IndicateurCard key={indicateur.id} indicateur={indicateur} />
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
};

export default Indicateurs;
