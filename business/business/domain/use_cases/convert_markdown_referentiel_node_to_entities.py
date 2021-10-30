import math
from typing import Dict, List

from business.domain.models import events
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.litterals import ReferentielId
from business.utils.action_id import ActionId
from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models import commands
from business.domain.models.action_points import ActionPoints
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.utils.action_id import build_action_id

class MarkdownReferentielNodeInconsistent(Exception):
    pass


class ConvertMarkdownReferentielNodeToEntities:
    points_round_digits = 2

    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, command: commands.ConvertMarkdownReferentielNodeToEntities):
        self.referentiel_node = command.referentiel_node


        self.forward_nodes = self._build_forward_nodes(self.referentiel_node)
        self.backward_nodes = self.forward_nodes[::-1]


        if self.referentiel_node.referentiel_id is None: 
            self.bus.publish_event(events.MarkdownReferentielNodeInconsistencyFound(f"L'action racine (dont l'identifiant est '') doit avoir un `referentiel_id` renseigné.'"))
            return 

        self.referentiel_id: ReferentielId = self.referentiel_node.referentiel_id

        try: 
            self.check_all_identifiant_are_unique()
            self.check_actions_children_percentages_sum_to_100()
        except MarkdownReferentielNodeInconsistent as inconsistency:
            self.bus.publish_event(events.MarkdownReferentielNodeInconsistencyFound(str(inconsistency)))
            return

        definition_entities = (
            self.infer_action_definition_entities_from_markdown_action_node(
            )
        )
        children_entities = (
            self.infer_action_children_entities_from_markdown_action_node(
            )
        )

        points_by_action_id = self.infer_points_by_id_from_markdown_action_node(
            definition_entities
        )

        try:
            self.check_action_points_values_are_not_nan(points_by_action_id)
            self.check_actions_children_points_sum_to_parent_points(
                points_by_action_id, children_entities
            )
        except MarkdownReferentielNodeInconsistent as inconsistency:
            self.bus.publish_event(events.MarkdownReferentielNodeInconsistencyFound(str(inconsistency)))
            return 

        points_entities = [
            ActionPoints(
                action_id=action_id,
                value=points_value if points_value is not None else math.nan,
            )
            for action_id, points_value in points_by_action_id.items()
        ]
        self.bus.publish_event(events.MarkdownReferentielNodeConvertedToEntities(points=points_entities, definitions=definition_entities, children=children_entities))


    def check_all_identifiant_are_unique(self,
    ):
        all_identifiants = [node.identifiant for node in self.forward_nodes]

        if len(all_identifiants) != len(set(all_identifiants)):
            raise MarkdownReferentielNodeInconsistent(
                f"Tous les identifiants devraient être uniques. Doublons: "
            )

 
    def check_actions_children_percentages_sum_to_100(
        self,
    ):
        for node in self.forward_nodes:
            action_children = node.actions
            if action_children and action_children[0].pourcentage is not None:
                children_percentages = [action.pourcentage or 0. for action in action_children]
                sum_children_percentages = sum(children_percentages)
                if sum_children_percentages != 100:
                    raise MarkdownReferentielNodeInconsistent(
                        f"Les valeurs des actions {self._format_action_identifiants(action_children)} sont renseignées en pourcentage, mais leur somme fait {sum_children_percentages} au lieu de 100."
                    )

    def check_actions_children_points_sum_to_parent_points(
        self,
        points_by_action_id: Dict[ActionId, float],
        children_entities: List[ActionChildren],
    ):
        for children_entity in children_entities:
            children_ids = children_entity.children_ids
            if children_ids:
                parent_point = points_by_action_id[children_entity.action_id]
                children_point_sum = self._round(sum(
                    [points_by_action_id[child_id] for child_id in children_ids]
                ))
                if not math.isclose(parent_point, children_point_sum, abs_tol=1e-1):
                    raise MarkdownReferentielNodeInconsistent(
                        f"Les valeurs des actions de l'action {children_entity.action_id} sont renseignées en points, mais leur somme fait {children_point_sum} au lieu de {parent_point}."
                    )

    def check_action_points_values_are_not_nan(
        self, points_by_identifiant: Dict[ActionId, float]
    ):
        for action_id, point_value in points_by_identifiant.items():
            if math.isnan(point_value):
                raise MarkdownReferentielNodeInconsistent(
                    f"Les points de l'action {action_id} n'ont pas pu être inférés. "
                )

    def infer_points_by_id_from_markdown_action_node(
        self, definitions: List[ActionDefinition]
    ) -> Dict[ActionId, float]:
        """Infer points of all actions given definitions

        First, consider all points that are specified in the definitions.
        Then, propagate the points backward (from children to parents)
        Finaly, propagate the points forward (from parents to children) using pourcentage or equi-distribution
        """
        # First, report points that are written in the definitions
        points_by_identifiant = {
            definition.identifiant: definition.points
            for definition in definitions
            if definition.points is not None
        }
    
        # Then, fill actions with 0 points 
        for node in self.forward_nodes:
            node_children = node.actions
            some_points_defined =  any([child.points is not None for child in node_children])
            if some_points_defined:
                for child in node_children: 
                    if child.points is None: 
                        points_by_identifiant[child.identifiant] = 0.0
        
        # Then, fill parent points from children
        for node in self.backward_nodes:
            if node.identifiant not in points_by_identifiant and node.pourcentage is None:
                node_children = node.actions
            
                if node_children and node_children[0].identifiant in points_by_identifiant:
                    points_by_identifiant[node.identifiant] = sum([points_by_identifiant[child.identifiant] for child in node_children])
                
        # Then, replace percentages by points
        for node in self.forward_nodes:
            action_points = points_by_identifiant[node.identifiant]
            node_children = node.actions
            if node_children and node_children[0].identifiant not in points_by_identifiant:
                percentage_equidistributed = all([child.points is None for child in node_children]) # if pourcentage is not specified, then points are equi-distributed within siblings
                for child in node_children:
                    pourcentage = 100 / len(node_children) if percentage_equidistributed else (child.pourcentage or 0.0)  # if some pourcentage amongst siblings are specified, then those that are not have a pourcentage of 0.
                    child_points = self._round((pourcentage / 100) * action_points) 
                    points_by_identifiant[child.identifiant] = child_points

        return {
            build_action_id(self.referentiel_id, identifiant): points
            for (identifiant, points) in points_by_identifiant.items()
        }
    

    def infer_action_definition_entities_from_markdown_action_node(
        self
    ) -> List[ActionDefinition]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_definition_entities: List[ActionDefinition] = []
        for node in self.forward_nodes:
            action_definition_entity = ActionDefinition(
                referentiel_id=self.referentiel_id, # type: ignore
                thematique_id=node.thematique_id,
                action_id=build_action_id(self.referentiel_id, node.identifiant),
                identifiant=node.identifiant,
                nom=node.nom,
                contexte=node.contexte,
                description=node.description,
                exemples=node.exemples,
                ressources=node.ressources,
                points=node.points,
                pourcentage=node.pourcentage,
            )
            action_definition_entities.append(action_definition_entity)
        return action_definition_entities


    def infer_action_children_entities_from_markdown_action_node(
        self,
    ) -> List[ActionChildren]:
        """Convert a MarkdownActionNode to a list of ActionDefinition"""
        action_children_entities: List[ActionChildren] = []
        for node in self.forward_nodes:
            action_children_entity = ActionChildren(
                action_id=build_action_id(self.referentiel_id, node.identifiant),
                children_ids=[
                    build_action_id(self.referentiel_id, child.identifiant)
                    for child in node.actions
                ],
            )
            action_children_entities.append(action_children_entity)

        return action_children_entities

    @staticmethod
    def _format_action_identifiants(actions: List[MarkdownActionNode]) -> str:
        return ", ".join([action.identifiant for action in actions])

    def _round(self, value: float) -> float: 
        return round(value, self.points_round_digits)
    
    @staticmethod
    def _build_forward_nodes(node: MarkdownActionNode) -> List[MarkdownActionNode]:
        forward_nodes: List[MarkdownActionNode] = []
        def _append_node(node: MarkdownActionNode):
            forward_nodes.append(node)
            if node.actions:
                list(map(_append_node, node.actions))
        _append_node(node)
        return forward_nodes