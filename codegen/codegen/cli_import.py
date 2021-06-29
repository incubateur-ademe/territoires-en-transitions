import json
import os
from dataclasses import dataclass
from typing import List, Dict

import pandas as pd
import typer
from fuzzywuzzy import process

from codegen.action.process import referentiel_from_actions
from codegen.action.read import build_action
from codegen.paths import orientations_markdown_dir
from codegen.utils.files import load_md, sorted_files, write, load_json

app = typer.Typer()


@dataclass()
class Statut:
    action_id: str
    epci_id: str
    avancement: str
    annee: int


@dataclass()
class Message:
    action_id: str
    epci_id: str
    body: str
    annee: int


@app.command()
def dteci(
    data_dir: str = '../referentiels/data',
    output_dir: str = '../referentiels/data'
) -> None:
    """
    Load dteci data (one shot)
    """
    table_correspondance: list = load_json(os.path.join(data_dir, 'table_correspondance.json'))
    server_niveaux = load_json(os.path.join(data_dir, 'server_niveaux.json'))
    server_territoires: Dict[dict] = load_json(os.path.join(data_dir, 'server_territoires.json'))
    collectivites = pd.read_excel(os.path.join(data_dir, 'collectivités.xlsx'), dtype=str, sheet_name=0, header=0)

    nom_repris: List[str] = [row['nom'] for index, row in collectivites.iterrows()
                             if str(row['Repris']).strip().startswith('o')]

    territoires_repris: List[dict] = [territoire for territoire in server_territoires.values()
                                      if territoire['nom'] in nom_repris]

    id_repris: List[str] = [t['id'] for t in territoires_repris]
    niveaux_repris: List[dict] = [n for n in server_niveaux.values() if n['territoireId'] in id_repris]

    statuts: List[Statut] = []
    messages: List[Message] = []

    # iterate on the correspondance table
    for axe in table_correspondance:
        for orientation in axe['orientations']:
            for niveau in orientation['niveaux']:
                # process corresponding niveau data.
                indicateur: dict = niveau.get('indicateur', {})
                niveau_data = [n for n in niveaux_repris if n['niveauId'] == niveau['id']]

                def add_statut(action_id: str, avancement: str):
                    statuts.append(Statut(
                        action_id=action_id,
                        epci_id=n['territoireId'],
                        avancement=avancement,
                        annee=n['annee'],
                    ))

                def add_message(body: str):
                    print(niveau['id'] + f': {body}')
                    messages.append(Message(
                        action_id=niveau['id'],
                        epci_id=n['territoireId'],
                        body=body,
                        annee=n['annee'],
                    ))

                # question (oui/non)
                if question := indicateur.get('question'):
                    oui = question['oui']
                    non = question['non']
                    if not oui['faite'] and not oui['pas_faite'] and not non['faite'] and not non['pas_faite']:
                        # no way to extract statuts
                        for n in niveau_data:
                            if valeur := n.get('valeur'):
                                add_message(f"Votre réponse : {'oui' if valeur['oui'] else 'non'}")

                    else:
                        # convert to statuts
                        for n in niveau_data:
                            if valeur := n.get('valeur'):
                                if valeur['oui']:  # the answer is oui
                                    for action_id in oui['faite']:
                                        add_statut(action_id, 'faite')
                                    for action_id in oui['pas_faite']:
                                        add_statut(action_id, 'pas_faite')
                                else:  # the answer is non
                                    for action_id in non['faite']:
                                        add_statut(action_id, 'faite')
                                    for action_id in non['pas_faite']:
                                        add_statut(action_id, 'pas_faite')

                # choix (checkboxes)
                elif choix := indicateur.get('choix'):
                    for c in choix:
                        # the niveau data matching the current choice `c`
                        chosen = [n for n in niveau_data if c['id']
                                  in [v['id'] for v in n.get('valeur', {}).get('ids', [])]]

                        for data in chosen:
                            for action_id in c['faite']:
                                statuts.append(
                                    Statut(
                                        action_id=action_id,
                                        epci_id=data['territoireId'],
                                        avancement='faite',
                                        annee=data['annee'],
                                    ))
                            for action_id in c['pas_faite']:
                                statuts.append(
                                    Statut(
                                        action_id=action_id,
                                        epci_id=data['territoireId'],
                                        avancement='pas_faite',
                                        annee=data['annee'],
                                    ))

                # liste (dropdown)
                elif liste := indicateur.get('liste'):
                    for n in niveau_data:
                        if valeur := n.get('valeur'):
                            selected = valeur['id']
                            match = next(item for item in liste if item['id'] == selected)
                            for action_id in match['faite']:
                                add_statut(action_id, 'faite')
                            for action_id in match['pas_faite']:
                                add_statut(action_id, 'pas_faite')

                # interval - no way to extract statuts
                elif interval := indicateur.get('interval'):
                    for n in niveau_data:
                        if valeur := n.get('valeur'):
                            add_message(f"Votre réponse : {valeur.get('nombre', 0)}")

                # intervalles  - no way to extract statuts
                elif intervalles := indicateur.get('intervalles'):
                    for n in niveau_data:
                        if valeur := n.get('valeur'):
                            add_message(
                                f"Vos réponses : \n"
                                f"- {intervalles[0]['nom']}: {valeur.get('a', {}).get('nombre', 0)} \n"
                                f"- {intervalles[1]['nom']}: {valeur.get('b', {}).get('nombre', 0)}"
                            )

                # fonction - no way to extract statuts
                elif fonction := indicateur.get('fonction'):
                    for n in niveau_data:
                        if valeur := n.get('valeur'):
                            add_message(f"Votre réponse : {valeur.get('nombre', 0)}")

                # questions
                elif questions := indicateur.get('questions'):
                    for index, question in enumerate(questions.values()):
                        letter = ('a', 'b')[index]
                        oui = question['oui']
                        non = question['non']
                        if not oui['faite'] and not oui['pas_faite'] and not non['faite'] and not non['pas_faite']:
                            raise NotImplementedError

                        for n in niveau_data:
                            if valeur := n.get('valeur'):
                                if valeur[letter]['oui']:  # the answer is oui
                                    for action_id in oui['faite']:
                                        add_statut(action_id, 'faite')
                                    for action_id in oui['pas_faite']:
                                        add_statut(action_id, 'pas_faite')
                                else:  # the answer is non
                                    for action_id in non['faite']:
                                        add_statut(action_id, 'faite')
                                    for action_id in non['pas_faite']:
                                        add_statut(action_id, 'pas_faite')

                elif niveau['id'].startswith('5'):
                    for n in niveau_data:
                        if valeur := n.get('valeur'):
                            if actions_pilier := valeur.get('actions'):
                                add_message(f"Vos réponses : \n" +
                                            '\n'.join([
                                                f"{action.get('pilierId', '')} :\n - description {action.get('description', '')}\n - preuve: {action.get('preuve', '')}"
                                                for action in actions_pilier])
                                            )

                else:
                    raise NotImplementedError

    def statut_to_insert(statut: Statut) -> str:
        action_id = statut.action_id
        epci_id = statut.epci_id
        avancement = statut.avancement
        return f"INSERT INTO public.actionstatus (id, action_id, epci_id, avancement, created_at, modified_at, latest) VALUES (DEFAULT, '{action_id}', '{epci_id}', '{avancement}', DEFAULT, DEFAULT, true);"

    latest_statuts: List[Statut] = []

    for statut in statuts:
        # keep the latest annee for every statut
        latest_statuts.append(sorted(
            [s for s in statuts if s.epci_id == statut.epci_id and s.action_id == statut.action_id],
            key=lambda statut: statut.annee
        )[-1])

    sql = '\n'.join([statut_to_insert(statut) for statut in latest_statuts])
    write('dteci_statuts.sql', sql)


@app.command()
def correspondance_table(
    orientations_dir=orientations_markdown_dir,
    correspondance_file: str = '../referentiels/sources/dteci_correspondance.json',
    output_dir: str = '../referentiels/data'
) -> None:
    """
    Generate correspondance table (one shot)
    """
    files = sorted_files(orientations_dir, 'md')
    actions_economie_circulaire = []

    for file in files:
        md = load_md(file)
        action = build_action(md)
        action['climat_pratic_id'] = 'eci'
        actions_economie_circulaire.append(action)

    # relativize_ids(actions_economie_circulaire, 'economie_circulaire')
    economie_circulaire = referentiel_from_actions(
        actions_economie_circulaire,
        id='economie_circulaire',
        name="Economie circulaire"
    )

    def actionById(id: str, actions: List[dict]) -> dict:
        for action in actions:
            if action['id'] == id:
                return action
            elif id.startswith(action['id']):
                return actionById(id, action['actions'])

    def parentId(action: dict) -> str:
        ns = action['id'].split('.')
        ns.pop()
        return '.'.join(ns)

    with open(correspondance_file, encoding='utf-8') as file:
        axes = json.load(file)

        for axe in axes:
            for orientation in axe['orientations']:
                for niveau in orientation['niveaux']:
                    id = niveau['id']
                    action = actionById(id, economie_circulaire['actions'])
                    print(id)

                    if not action or 'indicateur' not in niveau.keys():
                        continue

                    indicateur = niveau['indicateur']

                    # handle oui non
                    if 'question' in indicateur.keys():
                        question = indicateur['question']
                        if action['actions']:
                            # ex 3.1.1
                            indicateur['raison'] = f"{len(action['actions'])} actions pour un seul niveau en oui non"
                            continue

                        question['oui']['faite'] = [action['id']]

                    # handle many oui non
                    elif 'questions' in indicateur.keys():
                        questions = indicateur['questions']

                        if not action['actions']:
                            indicateur['raison'] = 'Pas de sous actions pour plusieurs oui non'
                            continue

                        noms = [action['nom'] for action in action['actions']]
                        for question in questions.keys():
                            choice, score = process.extractOne(question, noms)
                            chosen = [action for action in action['actions'] if action['nom'] == choice][0]

                            questions[question]['oui']['faite'] = [chosen['id']]
                            questions[question]['oui']['raison'] = f'"{action["id"]} {option["nom"]}" ' \
                                                                   f'ressemble à {score}% à "{choice}"'

                    # handle fonction
                    elif 'fonction' in indicateur.keys():
                        indicateur['raison'] = 'Pas de correspondance pour une fonction'

                    # handle interval
                    elif 'interval' in indicateur.keys():
                        indicateur['raison'] = 'Pas de correspondance pour des intervalles de valeurs'

                    # handle intervalles
                    elif 'intervalles' in indicateur.keys():
                        indicateur['raison'] = 'Pas de correspondance pour des intervalles de valeurs'

                    # handle checkboxes
                    elif 'choix' in indicateur.keys():
                        choix = indicateur['choix']

                        if not action['actions']:
                            indicateur[
                                'raison'] = f"pas de sous actions à {action['id']} pour ce niveau à choix multiple"
                            continue

                        if len(choix) > len(action['actions']):
                            indicateur[
                                'raison'] = f"plus d'options ({len(choix)}) que d'actions ({len(action['actions'])})"
                            continue

                        noms = [action['nom'] for action in action['actions']]

                        for option in choix:
                            choice, score = process.extractOne(option["nom"], noms)
                            chosen = [action for action in action['actions'] if action['nom'] == choice][0]
                            option['faite'] = [chosen['id']]
                            option['raison'] = f'"{action["id"]} {option["nom"]}" ressemble à {score}% à "{choice}"'

                    # handle dropdown
                    elif 'liste' in indicateur.keys():
                        liste = indicateur['liste']

                        if not action['actions']:
                            indicateur['raison'] = f"pas de sous actions à {action['id']} pour ce niveau à liste"
                            continue

                        if len(liste) > len(action['actions']):
                            indicateur[
                                'raison'] = f"plus d'options ({len(liste)}) que d'actions ({len(action['actions'])})"
                            continue

                        noms = [action['nom'] for action in action['actions']]

                        for option in liste:
                            choice, score = process.extractOne(option["nom"], noms)
                            chosen = [action for action in action['actions'] if action['nom'] == choice][0]
                            i = int(chosen['id'].split('.')[-1])
                            option['faite'] = [chosen['id']]
                            option['faite'] = [f'{parentId(chosen)}.{n}' for n in range(1, i + 1)]
                            option['raison'] = f'"{action["id"]} {option["nom"]}" ressemble à {score}% à "{choice}"'
                            print(option['faite'])

        write(os.path.join(output_dir, 'correspondance_table.json'), json.dumps(axes, indent=4, ensure_ascii=False))
