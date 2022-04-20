from business.personnalisation.models import Question
from business.personnalisation.find_regles_errors import find_regles_errors
from business.referentiel.domain.models.personnalisation import Regle
from business.utils.action_id import ActionId

questions = [
    Question(
        "question_choix",
        "choix",
        ["question_choix_a", "question_choix_b", "question_choix_c"],
    ),
    Question(
        "question_proportion",
        "proportion",
    ),
    Question(
        "question_binaire",
        "binaire",
    ),
]


def test_regle_desactivation_with_correct_choix_succeeds():
    regle_formule = "reponse(question_choix, question_choix_a)"
    assert (
        find_regles_errors([Regle(regle_formule, "desactivation")], questions, []) == []
    )


def test_regle_desactivation_with_incorrect_output_type_fails():
    regle_formule = "reponse(question_proportion)"
    regles = find_regles_errors([Regle(regle_formule, "desactivation")], questions, [])
    assert regles == [
        "\nErreur dans la régle formulée reponse(question_proportion) : La règle de type desactivation formulée reponse(question_proportion) n'a pas le bon type de sortie : <class 'float'> au lieu de booléen."
    ]


def test_regle_with_incorrect_choix_fails():
    regle_formule = "reponse(question_choix, question_choix_f)"
    regles = find_regles_errors([Regle(regle_formule, "desactivation")], questions, [])
    assert regles == [
        '\nErreur dans la régle formulée reponse(question_choix, question_choix_f) : Error trying to process rule "reponse_comparison":\n\nL\'id de choix question_choix_f est inconnu pour la question question_choix. Choix possibles : question_choix_a, question_choix_b, question_choix_c'
    ]


def test_regle_choix_with_incorrect_question_id_fails():
    regle_formule = "reponse(question_inconnue, question_inconnue_choix)"
    regles = find_regles_errors([Regle(regle_formule, "desactivation")], questions, [])
    assert regles == [
        '\nErreur dans la régle formulée reponse(question_inconnue, question_inconnue_choix) : Error trying to process rule "reponse_comparison":\n\nId de question inconnue: question_inconnue.'
    ]


def test_regle_reduction_using_question_of_type_proportion_succeeds():
    regle_formule = "reponse(question_proportion)"
    assert find_regles_errors([Regle(regle_formule, "reduction")], questions, []) == []


def test_regle_reduction_with_wrong_output_type_fails():
    regle_formule = "reponse(question_choix, question_choix_a)"
    errors = find_regles_errors([Regle(regle_formule, "reduction")], questions, [])
    assert errors == [
        "\nErreur dans la régle formulée reponse(question_choix, question_choix_a) : La règle de type reduction formulée reponse(question_choix, question_choix_a) n'a pas la bonne sortie : <class 'bool'> au lieu de nombre."
    ]


def test_regle_call_reponse_on_question_of_type_proportion_with_2_args_fails():
    regle_formule = "reponse(question_proportion, choix)"
    errors = find_regles_errors([Regle(regle_formule, "desactivation")], questions, [])
    assert errors == [
        "\nErreur dans la régle formulée reponse(question_proportion, choix) : Error trying to process rule \"reponse_comparison\":\n\nLa question d'id question_proportion est de type proportion, donc la fonction réponse n'attend qu'un argument."
    ]


def test_regle_desactivation_on_question_of_type_binaire_succeeds():
    regle_formule = "reponse(question_binaire, OUI)"
    assert (
        find_regles_errors([Regle(regle_formule, "desactivation")], questions, []) == []
    )


def test_regle_desactivation_on_question_of_type_binaire_fails_if_wrong_answer():
    regle_formule = "reponse(question_binaire, Ni_Oui_Ni_Non)"
    errors = find_regles_errors([Regle(regle_formule, "desactivation")], questions, [])
    assert errors == [
        '\nErreur dans la régle formulée reponse(question_binaire, Ni_Oui_Ni_Non) : Error trying to process rule "reponse_comparison":\n\nL\'id de choix Ni_Oui_Ni_Non est inconnu pour la question question_binaire. Choix possibles : OUI, NON'
    ]


def test_regle_identite_raises_on_bad_property():
    errors = find_regles_errors([Regle("identite(yo, lo)", "desactivation")], [], [])
    assert len(errors) == 1
    assert errors[0].endswith("yo is not a valid property.")


def test_regle_identite_raises_on_bad_type_value():
    errors = find_regles_errors([Regle("identite(type, lo)", "desactivation")], [], [])
    assert len(errors) == 1
    assert errors[0].endswith("lo is not a valid 'type'.")


def test_regle_identite_passes_on_valid_type_value():
    errors = find_regles_errors(
        [Regle("identite(type, commune)", "desactivation")], [], []
    )
    assert len(errors) == 0


def test_regle_identite_raises_on_bad_population_value():
    errors = find_regles_errors(
        [Regle("identite(population, lo)", "desactivation")], [], []
    )
    assert len(errors) == 1
    assert errors[0].endswith("lo is not a valid 'population'.")


def test_regle_identite_passes_on_valid_population_value():
    errors = find_regles_errors(
        [Regle("identite(population, moins_de_10000)", "desactivation")], [], []
    )
    assert len(errors) == 0


def test_regle_identite_raises_on_bad_localisation_value():
    errors = find_regles_errors(
        [Regle("identite(localisation, lo)", "desactivation")], [], []
    )
    assert len(errors) == 1
    assert errors[0].endswith("lo is not a valid 'localisation'.")


def test_regle_identite_passes_on_valid_localisation_value():
    errors = find_regles_errors(
        [Regle("identite(localisation, DOM)", "desactivation")], [], []
    )
    assert len(errors) == 0


def test_regle_score_passes_on_valid_action_id():
    errors = find_regles_errors(
        [Regle("score(eci_1)", "score")], [], [ActionId("eci_1")]
    )
    assert len(errors) == 0


def test_regle_score_fails_on_invalid_action_id():
    errors = find_regles_errors([Regle("score(eci_1)", "score")], [], [])
    assert len(errors) == 1
    assert (
        errors[0]
        == '\nErreur dans la régle formulée score(eci_1) : Error trying to process rule "score_value":\n\nId de l\'action inconnue: eci_1.'
    )
