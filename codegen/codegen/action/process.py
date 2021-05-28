from typing import List


def relativize_ids(actions: List[dict], referentiel_slug: str) -> None:
    """Add path to actions in place"""
    for action in actions:
        if 'id' in action.keys():
            action['id_nomenclature'] = action['id']
            action['id'] = f'{referentiel_slug}__{action["id"]}'
        if 'actions' in action.keys():
            relativize_ids(action['actions'], referentiel_slug)


def clean_thematiques(actions: List[dict]) -> List:
    cleaned_actions = actions.copy()
    for action in cleaned_actions:
        theme = action['climat_pratic_id'].strip() if 'climat_pratic_id' in action.keys() else ''
        action['thematique_id'] = theme if theme else 'pas_de_theme'
    return cleaned_actions


def propagate_thematiques(actions: List[dict], thematique_id: str = '') -> List:
    """Propagatee thematiques ids to children"""
    cleaned_actions = actions.copy()

    for action in cleaned_actions:
        if thematique_id:
            if 'thematique_id' in action.keys() and action['thematique_id']:
                continue
            action['thematique_id'] = thematique_id
        if action['actions']:
            action['actions'] = propagate_thematiques(action['actions'], action['thematique_id'])

    return cleaned_actions
