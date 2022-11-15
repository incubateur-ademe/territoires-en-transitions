from .fixtures import *
from pathlib import Path
import yaml
from business.utils.models.action_statut import (
    ActionStatut,
    DetailedAvancement,
)


def test_compare_inputs_to_results(test_post_personnalize, test_post_evaluate):
    pathlist = Path("./tests/yaml").glob('**/*.test.yml')

    # Pour chaque fichier yaml
    for path in pathlist:
        path_in_str = str(path)
        print('')
        print('_' * 80)
        print(path_in_str)

        # On ouvre le fichier et on charge les données
        with open(path) as f:
            data = yaml.safe_load(f)
            print(data['Test'])
            print('')

            # Convertit les réponses
            reponses = []
            if "Réponses" in data:
                for question_id in data["Réponses"].keys():
                    reponse = data["Réponses"][question_id]
                    if reponse is False:
                        reponse = 'NON'
                    elif reponse is True:
                        reponse = 'OUI'
                    reponses.append(Reponse(question_id, reponse))

            # Lit les caratéristiques de la collectivité
            indentite = None
            if "Collectivité" in data:
                collectivite = data['Collectivité']
                indentite = IdentiteCollectivite(
                    type=collectivite.get('type') or [],
                    population=collectivite.get('population') or [],
                    localisation=collectivite.get('localisation') or [],
                )

            # On calcul la personnalisation à partir des réponses et de l'identité
            consequences = test_post_personnalize(reponses, indentite)

            # Lit les statuts
            statuts = []
            if "Statuts" in data:
                for action_id in data['Statuts'].keys():
                    statut = data['Statuts'][action_id]
                    avancement = None
                    if statut == 'fait':
                        avancement = DetailedAvancement(fait=1.0, programme=0.0, pas_fait=0.0)
                    elif statut == 'programme':
                        avancement = DetailedAvancement(fait=0.0, programme=1.0, pas_fait=0.0)
                    elif statut == 'pas_fait':
                        avancement = DetailedAvancement(fait=0.0, programme=0.0, pas_fait=1.0)
                    statuts.append(ActionStatut(
                        action_id=action_id,
                        detailed_avancement=avancement,
                        concerne=statut != 'non_concerne'
                    ))

            # Pour chaque référentiel on calcul les scores et on les ajoute à [scores].
            scores = dict()
            for ref in ['cae', 'eci']:
                ref_consequences = {  # on ne garde que les consequence du référentiel
                    action_id: consequence
                    for action_id, consequence in consequences.items()
                    if action_id.startswith(ref)
                }
                ref_statuts = [statut for statut in statuts if statut.action_id.startswith(ref)]
                # Simule un appel à l'API
                ref_scores = test_post_evaluate(ref, ref_statuts, ref_consequences)
                scores = scores | ref_scores

            # Pour chaque score du yaml
            for action_id in data['Scores'].keys():
                have = vars(scores[action_id])
                want = data['Scores'][action_id]
                test = want.pop('test', '')
                print(f'{action_id}: {test}')
                print(f'- have {have}')
                print(f'- want {want}')
                # On compare chaque valeur avec l'objet obtenu par l'API
                for k in [k for k in want.keys() if k != 'test']:
                    assert have[k] == want[k], f'Erreur sur "{k}" de "{action_id}" pour: {test}'
