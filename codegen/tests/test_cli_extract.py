import os
from unittest.mock import ANY
from unittest.mock import patch, MagicMock

from codegen.cli_extract import mesures, indicateurs, orientations

output_dir = './tests/outputs'


@patch("codegen.cli_extract.write")
def test_indicateurs(mock_write: MagicMock):
    """Test that command `poetry run extract indicateurs` write files"""
    indicateurs(
        indicateurs_xlsx='../referentiels/sources/indicateurs_citergie.xlsx',
        correspondance_xlsx='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx',
        output_dir=output_dir,
    )
    mock_write.assert_any_call(os.path.join(output_dir, '1.md'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, '2.md'), ANY)


@patch("codegen.cli_extract.write")
def test_orientations(mock_write: MagicMock):
    """Test that command `poetry run extract mesures` write files"""
    orientations(output_dir=output_dir)
    mock_write.assert_any_call(os.path.join(output_dir, '1.1.md'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, '2.2.md'), ANY)


@patch("codegen.cli_extract.write")
def test_mesures(mock_write: MagicMock):
    """Test that command `poetry run extract mesures` write files"""
    mesures(
        doc_file='../referentiels/sources/citergie.docx',
        correspondance_xlsx='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx',
        output_dir=output_dir,
    )

    mock_write.assert_any_call(os.path.join(output_dir, '1.1.1.md'), ANY)
    mock_write.assert_any_call(os.path.join(output_dir, '1.1.2.md'), ANY)
