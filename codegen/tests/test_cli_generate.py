import os
from unittest.mock import ANY
from unittest.mock import patch, MagicMock

from codegen.cli_generate import mesures, indicateurs

output_dir = './tests/outputs'


@patch("codegen.cli_generate.write")
def test_mesures(mock_write: MagicMock):
    """Test that command `poetry run extract mesures` write files"""
    mesures(
        output_dir=output_dir,
        markdown_dir='../referentiels/markdown/mesures_citergie',
        html=True,
        json=True,
    )

    mock_write.assert_any_call(os.path.join(output_dir, 'mesures.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_1.1.1.html'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, 'mesure_1.1.1.json'), ANY)


@patch("codegen.cli_generate.write")
def test_indicateurs(mock_write: MagicMock):
    """Test that command `poetry run extract indicateurs` write the indicateurs page"""
    indicateurs(
        output_dir=output_dir,
        markdown_dir='../referentiels/markdown/indicateurs_citergie',
        html=True,
    )
    mock_write.assert_any_call(os.path.join(output_dir, 'all.html'), ANY)
