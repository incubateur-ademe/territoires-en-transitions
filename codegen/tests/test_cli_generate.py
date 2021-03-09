import os
from unittest.mock import ANY
from unittest.mock import patch, MagicMock

from codegen.cli_generate import mesures, indicateurs, all, shared, thematiques

output_dir = './tests/outputs'


@patch("codegen.cli_generate.write")
def test_all(mock_write: MagicMock):
    """Test that command `poetry run extract mesures` write files"""
    all(client_dir=output_dir)

    mock_write.assert_any_call(os.path.join(output_dir, 'dist', 'mesures.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'dist', 'indicateurs.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'vendors', 'thematiques.ts'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'vendors', 'indicateur_value.ts'), ANY)


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
        html=True,
        json=True,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'mesures.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_1.1.1.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_1.1.1.json'), ANY)


@patch("codegen.cli_generate.write")
def test_shared(mock_write: MagicMock):
    """Test that command `poetry run generate shared` write typescript"""
    shared(
        output_dir=output_dir,
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
