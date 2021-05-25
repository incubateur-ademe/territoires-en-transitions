from typing import List


def relativize_ids(actions: List[dict], referentiel_slug: str) -> None:
    """Add path to actions in place"""
    for action in actions:
        if 'id' in action.keys():
            action['id_nomenclature'] = action['id']
            action['id'] = f'{referentiel_slug}__{action["id"]}'
        if 'actions' in action.keys():
            relativize_ids(action['actions'], referentiel_slug)


def referentiel_from_actions(actions: List[dict], name: str, id: str) -> dict:
    """
    Nest actions into a root referentiel action.

    This function is tightly coupled with the way markdowns are organized in referentiels directories
    """
    referentiel = {
        'nom': name,
        'id': id,
        'actions': [],
        'description': ''
    }

    for action in actions:
        if '.' not in action['id']:
            level_1 = action
            level_1['actions'] = []
            referentiel['actions'].append(level_1)

            for action in actions:
                if action['id'].startswith(level_1['id']) and action['id'] != level_1['id']:
                    level_1['actions'].append(action)

    return referentiel


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
