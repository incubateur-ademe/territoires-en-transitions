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
    personnalisation_consequence = "personnalisation_consequence"


@dataclass
class views:
    action_children = "business_action_children"
    action_statut = "business_action_statut"
    unprocessed_action_statut_event = "unprocessed_action_statut_update_event"
    engine_question = "question_engine"
    personnalisation = "business_personnalisation"
    reponse = "business_reponse"
    identite = "collectivite_identite"
    unprocessed_reponse_event = "unprocessed_reponse_update_event"


@dataclass
class rpc:
    upsert_preuves = "business_upsert_preuves"
    upsert_indicateurs = "business_upsert_indicateurs"
    update_actions = "business_update_actions"
    insert_actions = "business_insert_actions"
    upsert_questions = "business_upsert_questions"
    business_replace_personnalisations = "business_replace_personnalisations"


@dataclass
class events:
    statut_update = "action_statut_update_event"
    reponse_update = "reponse_update_event"
    consequence_update = "consequence_update_event"
    collectivite_activation = "collectivite_activation_event"
