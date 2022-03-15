from marshmallow_dataclass import dataclass


@dataclass
class tables:
    client_scores = "client_scores"
    indicateur_definition = "indicateur_definition"
    indicateur_action = "indicateur_action"
    action_relation = "action_relation"
    action_definition = "action_definition"
    action_computed_points = "action_computed_points"
    question = "question"
    question_choix = "question_choix"
    question_action = "question_action"
    personnalisation = "personnalisation"
    personnalisation_regle = "personnalisation_regle"


@dataclass
class views:
    action_children = "business_action_children"
    action_statut = "business_action_statut"
    unprocessed_action_statut_event = "unprocessed_action_statut_update_event"
    questions = "business_questions"
    personnalisations = "business_personnalisations"


@dataclass
class rpc:
    upsert_indicateurs = "business_upsert_indicateurs"
    update_actions = "business_update_actions"
    upsert_questions = "business_upsert_questions"
    upsert_personnalisations = "business_upsert_personnalisations"
