from __future__ import annotations

import json
import math
import os
from copy import copy
from dataclasses import asdict
from glob import glob
from typing import Dict, List, Optional

from business.utils.models.actions import (
    ActionCategorie,
    ActionChildren,
    ActionDefinition,
    ActionReferentiel,
    ActionId,
    build_action_id,
)
from business.utils.action_tree import ActionTree
from business.utils.exceptions import MarkdownError
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from pydantic import ValidationError
from pydantic.main import BaseModel
from tqdm import tqdm


# Input models (from markdown)
# -------------
class MarkdownAction(BaseModel):
    identifiant: str
    nom: str
    thematique_id: str = ""
    description: str = ""
    contexte: str = ""
    exemples: str = ""
    ressources: str = ""
    reduction_de_potentiel: str = ""
    perimetre_de_levaluation: str = ""
    referentiel: Optional[ActionReferentiel] = None
    points: Optional[float] = None
    pourcentage: Optional[float] = None
    categorie: Optional[ActionCategorie] = None


class MarkdownActionTree(MarkdownAction):
    actions: List[MarkdownActionTree] = []

    def is_ancestor_of(
        self,
        child: MarkdownActionTree,
    ) -> bool:
        return (
            child.identifiant.startswith(self.identifiant)
            and self.identifiant != child.identifiant
        )

    def is_parent_of(self, child: MarkdownActionTree) -> bool:
        return self.is_ancestor_of(child) and child.level == self.level + 1

    def is_root(self) -> bool:
        return self.identifiant == ""

    @property
    def level(self) -> int:
        return len(self.identifiant.split("."))


MarkdownActionTree.update_forward_refs()


def parse_markdown_action_trees_from_folder(
    folder_path: str,
) -> tuple[list[MarkdownActionTree], list[str]]:
    md_files = glob(os.path.join(folder_path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers actions depuis le dossier {folder_path} :) "
    )
    action_nodes = []
    errors = []
    for md_file in tqdm(md_files):
        actions_as_dict = build_actions_as_dict_from_md(md_file)
        for action_as_dict in actions_as_dict:
            try:
                action_node = MarkdownActionTree(**action_as_dict)
                action_nodes.append(action_node)
            except ValidationError as validation_error:
                errors.append(str(validation_error))
    return action_nodes, errors


def compute_definitions_and_childrens(
    markdown_action_tree: MarkdownActionTree,
) -> tuple[list[ActionDefinition], list[ActionChildren]]:
    referentiel = markdown_action_tree.referentiel
    if not referentiel:
        raise MarkdownError(
            f"L'action racine (dont l'identifiant est '') doit avoir un `referentiel` renseigné.'"
        )
    md_actions_by_id = _infer_markdown_actions_by_id_from_tree(
        markdown_action_tree, referentiel
    )
    children_by_id = _infer_children_by_id_from_markdown_root_node(
        markdown_action_tree, referentiel
    )
    children = list(children_by_id.values())
    action_tree = ActionTree(children)

    # Report points and pourcentages that are written in the markdowns
    md_points_by_id = {
        action_id: definition.points
        for action_id, definition in md_actions_by_id.items()
        if definition.points is not None
    }
    md_pourcentages_by_id = {
        action_id: definition.pourcentage
        for action_id, definition in md_actions_by_id.items()
        if definition.pourcentage is not None
    }
    points_by_action_id = _infer_computed_points_by_id_from_md_points_and_pourcentages(
        action_tree, md_points_by_id, md_pourcentages_by_id
    )
    _check_all_action_points_have_been_infered(action_tree, points_by_action_id)
    _check_all_children_points_sum_to_parent_points(points_by_action_id, children_by_id)

    definitions = [
        ActionDefinition(
            action_id=action_id,
            referentiel=referentiel,
            identifiant=md_action.identifiant,
            nom=md_action.nom,
            contexte=md_action.contexte,
            description=md_action.description,
            exemples=md_action.exemples,
            ressources=md_action.ressources,
            perimetre_evaluation=md_action.perimetre_de_levaluation,
            reduction_potentiel=md_action.reduction_de_potentiel,
            md_points=md_action.points,
            md_pourcentage=md_action.pourcentage,
            computed_points=points_by_action_id[action_id],
            categorie=md_action.categorie,
        )
        for action_id, md_action in md_actions_by_id.items()
    ]
    return definitions, children


def convert_actions_markdown_folder_to_json(folder_path: str, json_filename: str):
    actions_nodes, errors = parse_markdown_action_trees_from_folder(folder_path)
    # Raise if any errors
    if errors:
        raise MarkdownError(
            "Erreurs dans le format des fichiers actions :\n- " + "\n- ".join(errors)
        )

    markdown_action_tree = referentiel_from_actions(actions_nodes)
    definitions, childrens = compute_definitions_and_childrens(markdown_action_tree)

    with open(json_filename, "w") as f:
        json.dump(
            {
                "definitions": [asdict(definition) for definition in definitions],
                "children": [asdict(children) for children in childrens],
            },
            f,
        )
    print(
        "Lecture et conversion réussies, le résultat JSON se trouve dans ",
        json_filename,
    )


# Functions used to parse a markdown folder to build a MarkdownActionNode
# -----------------------------------------------------------------------
def build_actions_as_dict_from_md(path: str) -> List[dict]:
    """Extract an action from a markdown document"""

    markdown = load_md(path)
    parser = build_markdown_parser(
        title_key="nom",
        description_key="description",
        initial_keyword="actions",
        keyword_node_builders={"actions": lambda: {"nom": "", "actions": []}},
    )
    actions_as_dict = parser(markdown)
    return actions_as_dict


def _find_parent_within_tree(
    child: MarkdownActionTree, tree: MarkdownActionTree
) -> Optional[MarkdownActionTree]:
    if not tree.is_ancestor_of(child):
        return
    if tree.is_parent_of(child):
        return tree

    ancestor_branch = [
        action for action in tree.actions if action.is_ancestor_of(child)
    ]

    if ancestor_branch:
        return _find_parent_within_tree(child, ancestor_branch[0])


def referentiel_from_actions(
    actions: List[MarkdownActionTree],
) -> MarkdownActionTree:
    """Nest actions into a root referentiel action.
    This function is tightly coupled with the way markdowns are organized in each referentiels directories
    """
    root_actions = list(filter(lambda action: action.is_root(), actions))
    if len(root_actions) != 1:
        raise MarkdownError(
            f"Le dossier de markdowns doit contenir une unique action racine (dont l'identifiant est ''). {len(root_actions)} trouvé(s)."
        )

    root_action = root_actions[0]

    regular_actions = list(filter(lambda action: not action.is_root(), actions))

    sorted_actions = list(
        reversed(
            sorted(
                regular_actions,
                key=lambda action: len(action.identifiant.split(".")),
            )
        )
    )

    for orphan in sorted_actions:
        if orphan.level == 1:  # Axes
            root_action.actions.append(orphan)
        else:
            closest_parents = list(
                filter(
                    lambda action: action.is_ancestor_of(orphan),
                    sorted_actions,
                )
            )
            if len(closest_parents) == 0:
                raise MarkdownError(f"L'action {orphan.identifiant} est orpheline ! ")

            closest_parent = closest_parents[0]

            parent = _find_parent_within_tree(orphan, closest_parent)

            if parent is None:
                breakpoint()
                raise MarkdownError(
                    f"Il manque un niveau entre l'action {closest_parent.identifiant} et son enfant {orphan.identifiant}"
                )

            parent.actions.append(orphan)

    return root_action


# Functions used to compute children, definitions and points from a MarkdownActionNode.
# -------------------------------------------------------------------------------------
def _check_all_children_points_sum_to_parent_points(
    points_by_action_id: Dict[ActionId, float],
    children_entities: Dict[ActionId, ActionChildren],
):
    for children_entity in children_entities.values():
        children_ids = children_entity.children
        if children_ids:
            parent_point = points_by_action_id[children_entity.action_id]
            children_point_sum = sum(
                [points_by_action_id[child_id] for child_id in children_ids]
            )
            if not math.isclose(parent_point, children_point_sum, rel_tol=1e-5):
                raise MarkdownError(
                    f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                )


def _check_all_action_points_have_been_infered(
    action_tree: ActionTree, points_by_identifiant: Dict[ActionId, float]
):
    for action_id in action_tree.forward_ids:
        point_value = points_by_identifiant.get(action_id, math.nan)
        if math.isnan(point_value):
            raise MarkdownError(
                f"Les points de l'action {action_id} n'ont pas pu être inféré. "
            )


def _infer_computed_points_by_id_from_md_points_and_pourcentages(
    action_tree: ActionTree,
    md_points_by_id: Dict[ActionId, float],
    md_pourcentages_by_id: Dict[ActionId, float],
) -> Dict[ActionId, float]:
    """Infer points of all actions given definitions

    First, consider all points that are specified in the definitions.
    Then, propagate the points backward (from children to parents)
    Finaly, propagate the points forward (from parents to children) using pourcentage or equi-distribution
    """
    points_by_id = copy(md_points_by_id)
    # Then, fill actions with 0 points if siblings have defined points (@florian : should this happen ?)
    for action_id in action_tree._forward_ids:  # Forward
        children_ids = action_tree.get_children(action_id)

        some_points_defined = any(
            [child_id in md_points_by_id for child_id in children_ids]
        )
        if some_points_defined:
            for child_id in children_ids:
                if child_id not in md_points_by_id:
                    points_by_id[child_id] = 0.0

    # Then, fill parent points from children
    for action_id in action_tree.backward_ids:
        children_ids = action_tree.get_children(action_id)
        if action_id not in points_by_id and action_id not in md_pourcentages_by_id:
            if children_ids and children_ids[0] in points_by_id:
                points_by_id[action_id] = sum(
                    [points_by_id[child_id] for child_id in children_ids]
                )
    # Then, replace percentages by points
    for action_id in action_tree._forward_ids:
        action_points = points_by_id[action_id]
        children_ids = action_tree.get_children(action_id)
        if children_ids and children_ids[0] not in points_by_id:
            percentage_equidistributed = all(
                [
                    child_id not in md_pourcentages_by_id
                    or md_pourcentages_by_id[child_id] == 0.0
                    for child_id in children_ids
                ]
            )  # if pourcentage is not specified, then points are equi-distributed within siblings

            if not percentage_equidistributed:
                sum_children_percentages = sum(
                    [
                        md_pourcentages_by_id.get(child_id, 0.0)
                        for child_id in children_ids
                    ]
                )
                if sum_children_percentages != 100:
                    raise MarkdownError(
                        f"Les valeurs des actions {', '.join(children_ids)} sont renseignées en pourcentage, mais leur somme fait {sum_children_percentages} au lieu de 100."
                    )
            child_ids_with_percentage_0 = [
                child_id
                for child_id in children_ids
                if md_pourcentages_by_id.get(child_id) == 0
            ]
            for child_id in children_ids:
                if percentage_equidistributed:
                    if child_id in child_ids_with_percentage_0:
                        child_points = 0.0
                    else:
                        child_points = action_points / (
                            len(children_ids) - len(child_ids_with_percentage_0)
                        )
                else:
                    child_points = (
                        md_pourcentages_by_id.get(child_id, 0.0) / 100
                    ) * action_points
                    # if some pourcentage amongst siblings are specified, then those that are not have a pourcentage of 0.
                points_by_id[child_id] = child_points
    return points_by_id


def _infer_markdown_actions_by_id_from_tree(
    md_action_tree: MarkdownActionTree, referentiel: ActionReferentiel
) -> Dict[ActionId, MarkdownAction]:
    """Convert a MarkdownActionNode to a list of ActionDefinition"""
    action_definition_entities: Dict[ActionId, MarkdownAction] = {}

    def _recursively_add_definition(node: MarkdownActionTree):
        action_id = build_action_id(referentiel, node.identifiant)
        if action_id in action_definition_entities:
            raise MarkdownError(
                f"Tous les identifiants devraient être uniques. Doublons: {node.identifiant}"
            )
        action_definition_entity = MarkdownAction(
            referentiel=referentiel,
            identifiant=node.identifiant,
            nom=node.nom,
            contexte=node.contexte,
            description=node.description,
            exemples=node.exemples,
            ressources=node.ressources,
            perimetre_de_levaluation=node.perimetre_de_levaluation,
            reduction_de_potentiel=node.reduction_de_potentiel,
            points=node.points,
            pourcentage=node.pourcentage,
            categorie=node.categorie,
        )
        action_definition_entities[action_id] = action_definition_entity
        for child_node in node.actions:
            _recursively_add_definition(child_node)
        return action_definition_entities

    return _recursively_add_definition(md_action_tree)


def _infer_children_by_id_from_markdown_root_node(
    root_node: MarkdownActionTree, referentiel: ActionReferentiel
) -> Dict[ActionId, ActionChildren]:
    """Convert a MarkdownActionNode to a list of ActionDefinition"""
    action_children_entities: Dict[ActionId, ActionChildren] = {}

    def _recursively_add_children(node: MarkdownActionTree):
        action_id = build_action_id(referentiel, node.identifiant)
        action_children_entity = ActionChildren(
            referentiel=referentiel,
            action_id=action_id,
            children=[
                build_action_id(referentiel, child.identifiant)
                for child in node.actions
            ],
        )
        action_children_entities[action_id] = action_children_entity
        for child_node in node.actions:
            _recursively_add_children(child_node)
        return action_children_entities

    return _recursively_add_children(root_node)
