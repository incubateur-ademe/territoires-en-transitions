from business.utils.models.questions import Question, Choix
from business.referentiel.check_regles_against_questions import (
    find_regle_error,
    FormuleChecker,
)
from business.utils.models.regles import Regle
from business.utils.models.actions import ActionId

questions = [
    Question(
        id="question_choix",
        type="choix",
        choix=[
            Choix(id="question_choix_a"),
            Choix(id="question_choix_b"),
            Choix(id="question_choix_c"),
        ],
        action_ids=[],
    ),
    Question(id="question_proportion", type="proportion", action_ids=[]),
    Question(id="question_binaire", type="binaire", action_ids=[]),
]
formule_checker = FormuleChecker(questions)


def test_regle_desactivation_with_correct_choix_succeeds():
    regle_formule = "reponse(question_choix, question_choix_a)"
    assert (
        find_regle_error(Regle(regle_formule, "desactivation"), formule_checker) is None
    )


def test_regle_desactivation_with_incorrect_output_type_fails():
    regle_formule = "reponse(question_proportion)"
    error = find_regle_error(Regle(regle_formule, "desactivation"), formule_checker)
    assert (
        error
        == "\nErreur dans la régle formulée reponse(question_proportion) : La règle de type desactivation formulée reponse(question_proportion) n'a pas le bon type de sortie : <class 'float'> au lieu de booléen."
    )


def test_regle_with_incorrect_choix_fails():
    regle_formule = "reponse(question_choix, question_choix_f)"
    error = find_regle_error(Regle(regle_formule, "desactivation"), formule_checker)
    assert (
        error
        == '\nErreur dans la régle formulée reponse(question_choix, question_choix_f) : Error trying to process rule "reponse_comparison":\n\nL\'id de choix question_choix_f est inconnu pour la question question_choix. Choix possibles : question_choix_a, question_choix_b, question_choix_c'
    )


def test_regle_choix_with_incorrect_question_id_fails():
    regle_formule = "reponse(question_inconnue, question_inconnue_choix)"
    error = find_regle_error(Regle(regle_formule, "desactivation"), formule_checker)
    assert (
        error
        == '\nErreur dans la régle formulée reponse(question_inconnue, question_inconnue_choix) : Error trying to process rule "reponse_comparison":\n\nId de question inconnue: question_inconnue.'
    )


def test_regle_reduction_using_question_of_type_proportion_succeeds():
    regle_formule = "reponse(question_proportion)"
    assert find_regle_error(Regle(regle_formule, "reduction"), formule_checker) is None


def test_regle_reduction_with_wrong_output_type_fails():
    regle_formule = "reponse(question_choix, question_choix_a)"
    error = find_regle_error(Regle(regle_formule, "reduction"), formule_checker)
    assert (
        error
        == "\nErreur dans la régle formulée reponse(question_choix, question_choix_a) : La règle de type reduction formulée reponse(question_choix, question_choix_a) n'a pas la bonne sortie : <class 'bool'> au lieu de nombre."
    )


def test_regle_call_reponse_on_question_of_type_proportion_with_2_args_fails():
    regle_formule = "reponse(question_proportion, choix)"
    error = find_regle_error(Regle(regle_formule, "desactivation"), formule_checker)
    assert (
        error
        == "\nErreur dans la régle formulée reponse(question_proportion, choix) : Error trying to process rule \"reponse_comparison\":\n\nLa question d'id question_proportion est de type proportion, donc la fonction réponse n'attend qu'un argument."
    )


def test_regle_desactivation_on_question_of_type_binaire_succeeds():
    regle_formule = "reponse(question_binaire, OUI)"
    assert (
        find_regle_error(Regle(regle_formule, "desactivation"), formule_checker) is None
    )


def test_regle_desactivation_on_question_of_type_binaire_fails_if_wrong_answer():
    regle_formule = "reponse(question_binaire, Ni_Oui_Ni_Non)"
    error = find_regle_error(Regle(regle_formule, "desactivation"), formule_checker)
    assert (
        error
        == '\nErreur dans la régle formulée reponse(question_binaire, Ni_Oui_Ni_Non) : Error trying to process rule "reponse_comparison":\n\nL\'id de choix Ni_Oui_Ni_Non est inconnu pour la question question_binaire. Choix possibles : OUI, NON'
    )


def test_regle_identite_raises_on_bad_property():
    error = find_regle_error(
        Regle("identite(yo, lo)", "desactivation"), formule_checker
    )
    assert error is not None
    assert error.endswith("yo is not a valid property.")


def test_regle_identite_raises_on_bad_type_value():
    error = find_regle_error(
        Regle("identite(type, lo)", "desactivation"), formule_checker
    )
    assert error is not None
    assert error.endswith("lo is not a valid 'type'.")


def test_regle_identite_passes_on_valid_type_value():
    error = find_regle_error(
        Regle("identite(type, commune)", "desactivation"), formule_checker
    )
    assert error is None


def test_regle_identite_raises_on_bad_population_value():
    error = find_regle_error(
        Regle("identite(population, lo)", "desactivation"), formule_checker
    )
    assert error is not None
    assert error.endswith("lo is not a valid 'population'.")


def test_regle_identite_passes_on_valid_population_value():
    error = find_regle_error(
        Regle("identite(population, moins_de_10000)", "desactivation"), formule_checker
    )
    assert error is None


def test_regle_identite_raises_on_bad_localisation_value():
    error = find_regle_error(
        Regle("identite(localisation, lo)", "desactivation"), formule_checker
    )
    assert error is not None
    assert error.endswith("lo is not a valid 'localisation'.")


def test_regle_identite_passes_on_valid_localisation_value():
    error = find_regle_error(
        Regle("identite(localisation, DOM)", "desactivation"), formule_checker
    )
    assert error is None
