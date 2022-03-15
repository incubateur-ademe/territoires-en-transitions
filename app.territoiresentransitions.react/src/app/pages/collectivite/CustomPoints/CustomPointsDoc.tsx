/**
 * Affiche l'onglet "Documentation"
 */

export type TCustomPointsDocProps = {};

export const CustomPointsDoc = (props: TCustomPointsDocProps) => {
  //const {} = props;
  return (
    <div data-test="CustomPointsDoc">
      <span className="font-bold">Nombre de points pour cette sous-action</span>
      <ul>
        <li>Minimum : 0</li>
        <li>Maximum : 6,67</li>
      </ul>
      <table
        className="fr-table fr-table--blue-ecume mt-8"
        style={{marginBottom: 0}}
      >
        <thead>
          <tr>
            <th scope="col">Condition</th>
            <th scope="col">Pondération</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Commune sans compétence voirie</td>
            <td style={{whiteSpace: 'nowrap'}}>Réduction à 0 sur 2 points</td>
          </tr>
          <tr>
            <td>Intercommunalité sans aucune compétence voirie</td>
            <td>Réduction à 0 sur 2 points</td>
          </tr>
          <tr>
            <td>
              Commune et intercommunalité avec compétence voirie uniquement sur
              trottoirs, parkings ou zones d'activités ou industrielles
            </td>
            <td>Réduction à 1 sur 2 points</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
