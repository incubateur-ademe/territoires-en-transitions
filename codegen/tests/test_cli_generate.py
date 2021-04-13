import os
from unittest.mock import ANY
from unittest.mock import patch, MagicMock

from codegen.cli_generate import mesures, indicateurs, all, shared, thematiques, actions
from codegen.paths import mesures_client_output_dir, indicateurs_client_output_dir, shared_client_models_dir, \
    thematique_client_output_dir

output_dir = './tests/outputs'


@patch("codegen.cli_generate.write")
def test_all(mock_write: MagicMock):
    """Test that command `poetry run extract mesures` write files"""
    all(
        thematique_typescript=True,
        thematique_json=False,
        mesures_html=True,
        mesures_json=False,
        indicateurs_html=True,
        shared_python=False,
        shared_typescript=True,
    )

    mock_write.assert_any_call(os.path.join(mesures_client_output_dir, 'mesures.html'), ANY)
    mock_write.assert_any_call(os.path.join(indicateurs_client_output_dir, 'indicateurs.html'), ANY)
    mock_write.assert_any_call(os.path.join(thematique_client_output_dir, 'thematiques.ts'), ANY)
    mock_write.assert_any_call(os.path.join(shared_client_models_dir, 'indicateur_value.ts'), ANY)



@patch("codegen.cli_generate.write")
def test_actions(mock_write: MagicMock):
    """Test that command `poetry run generate indicateurs` write the indicateurs page"""
    actions(client_output_dir=output_dir)

    mock_write.assert_any_call(os.path.join(output_dir, 'actions_referentiels.ts'), ANY)


@patch("codegen.cli_generate.write")
def test_indicateurs(mock_write: MagicMock):
    """Test that command `poetry run generate indicateurs` write the indicateurs page"""
    indicateurs(
        output_dir=output_dir,
        markdown_dir='../referentiels/markdown/indicateurs_citergie',
        html=True,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'indicateurs.html'), ANY)


@patch("codegen.cli_generate.write")
def test_mesures(mock_write: MagicMock):
    """Test that command `poetry run generate mesures` write files"""
    mesures(
        output_dir=output_dir,
        mesures_dir='../referentiels/markdown/mesures_citergie',
        orientations_dir='../referentiels/markdown/orientations_economie_circulaire',
        indicateurs_dir='../referentiels/markdown/indicateurs_citergie',
        html=True,
        json=True,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'mesures.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_citergie__1.1.1.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_citergie__1.1.1.json'), ANY)


@patch("codegen.cli_generate.write")
def test_shared(mock_write: MagicMock):
    """Test that command `poetry run generate shared` write typescript"""
    shared(
        client_output_dir=output_dir,
        markdown_dir='definitions/shared',
        typescript=True,
        python=False,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'domaines.ts'), ANY)


@patch("codegen.cli_generate.write")
def test_thematiques(mock_write: MagicMock):
    """Test that command `poetry run generate shared` write typescript"""
    thematiques(
        markdown_file='../referentiels/markdown/thematiques_climat_pratic/thematiques.md',
        output_dir=output_dir,
        output_typescript=True,
        output_json=False,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'thematiques.ts'), ANY)
