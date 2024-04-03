import os

from .fixtures import *
from pathlib import Path
import yaml
from business.utils.models.action_statut import (
    ActionStatut,
    DetailedAvancement,
)

yaml_tests_dir = "../markdown/tests"
yaml_tests_glob = os.environ.get("YAML_TESTS") or "**/*.test.yml"
paths = [('/'.join(str(path).split('/')[-2:]), path) for path in list(Path(yaml_tests_dir).glob(yaml_tests_glob))]


def test_yaml_files_should_be_present():
    assert len(paths) > 0, f'Des tests yaml devraient être présents dans {yaml_tests_dir}'


@pytest.mark.parametrize("name, path", sorted(paths))
def test_scores_should_match_yaml_expectations(test_post_personnalize, test_post_evaluate, name, path):
    path_in_str = str(path)
    print('')
    print('_' * 80)
    print(path_in_str)

    # On ouvre le fichier et on charge les données
    with open(path, encoding='utf8') as f:
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

        # Lit les caractéristiques de la collectivité
        identite = None
        if "Collectivité" in data:
            collectivite = data['Collectivité']
            identite = IdentiteCollectivite(
                type=collectivite.get('type') or [],
                population=collectivite.get('population') or [],
                localisation=collectivite.get('localisation') or [],
            )

        # On calcule la personnalisation à partir des réponses et de l'identité
        consequences = test_post_personnalize(reponses, identite)

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
                elif isinstance(statut, list):
                    avancement = DetailedAvancement(fait=statut[0], programme=statut[1], pas_fait=statut[2])
                statuts.append(ActionStatut(
                    action_id=action_id,
                    detailed_avancement=avancement,
                    concerne=statut != 'non_concerne'
                ))

        # Pour chaque référentiel on calcule les scores et on les ajoute à [scores].
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

        failures = 0
        # Pour chaque score du yaml
        for action_id in data['Scores'].keys():
            have = vars(scores[action_id])
            want = data['Scores'][action_id]
            test = want.pop('test', '')
            print(f'{action_id}: {test}')
            print(f'- have {have}')
            print(f'- want {want}')
            # On compare chaque valeur avec l'objet obtenu par l'API
            for k in [k for k in want.keys() if k != 'test' and have[k] != want[k]]:
                print(f'> Erreur sur "{k}" de "{action_id}":')
                print(f'\t- have: {have[k]}')
                print(f'\t- want: {want[k]}')
                failures += 1

        assert failures == 0, f'{failures} comparaisons ont échouées pour {data["Test"]}'
