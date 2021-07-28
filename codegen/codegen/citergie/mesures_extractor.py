"""Main module."""
import re
from typing import Callable, List

import docx.document
import docx.oxml.table
import docx.oxml.text.paragraph
import docx.table
import docx.text.paragraph
import pandas as pd
from docx.text.paragraph import Paragraph

from codegen.action.write import action_to_markdown
from codegen.utils.markdown_utils import void


def iter_paragraphs(parent, recursive=True):
    """
    https://stackoverflow.com/questions/52094242

    Yield each paragraph and table child within *parent*, in document order.
    Each returned value is an instance of Paragraph. *parent*
    would most commonly be a reference to a main Document object, but
    also works for a _Cell object, which itself can contain paragraphs and tables.
    """
    if isinstance(parent, docx.document.Document):
        parent_elm = parent.element.body
    elif isinstance(parent, docx.table._Cell):
        parent_elm = parent._tc
    else:  # pragma: no cover
        raise TypeError(repr(type(parent)))

    for child in parent_elm.iterchildren():
        if isinstance(child, docx.oxml.text.paragraph.CT_P):
            yield docx.text.paragraph.Paragraph(child, parent)
        elif isinstance(child, docx.oxml.table.CT_Tbl):
            if recursive:
                table = docx.table.Table(child, parent)
                for row in table.rows:
                    for cell in row.cells:
                        for child_paragraph in iter_paragraphs(cell):
                            yield child_paragraph


def p_low(p: Paragraph) -> str:
    """Lowered paragraph text"""
    return p.text.lower().strip()


def split_title(title: str) -> tuple:
    """Returns the id part (ex: 1.1.1) and the title parts."""
    title = title.strip()
    uid = re.match(r"\d+.\d+.\d+", title).group()
    return uid, title[len(uid) :].strip()


def split_weight(title: str) -> tuple:
    """Returns the percentage of an action along with its name."""
    title = title.strip()
    percentage = re.match(r"\d+%", title).group()
    return int(percentage[:-1]), title[len(percentage) :].strip()


def is_domaine(p: Paragraph) -> bool:
    """Returns True if paragraph is a sous domaine"""
    return bool(re.match(r"domaine \d+", p_low(p)))


def is_sous_domaine(p: Paragraph) -> bool:
    """Returns True if paragraph is a sous domaine"""
    return bool(re.match(r"\d+.\d+. ", p_low(p)))


def is_mesure_title(p: Paragraph) -> bool:
    """Returns True if paragraph is a mesure title."""
    return bool(re.match(r"\d+.\d+.\d+ ", p_low(p)))


def is_action_title(p: Paragraph) -> bool:
    """Returns True if paragraph is an action title."""
    return bool(re.match(r"\d+% ", p_low(p)))


def is_action_cat(p: Paragraph) -> bool:
    """Returns True if paragraph is an action category."""
    low = p_low(p)
    return low == "bases" or low == "effets" or low == "mise en œuvre"


def is_reduction(p: Paragraph) -> bool:
    """Returns if paragraph is 'Réduction de potentiel'"""
    return p_low(p) == "réduction de potentiel"


def is_perimeter(p: Paragraph) -> bool:
    """Returns if paragraph is 'Périmètre de l’évaluation'"""
    return p_low(p) == "périmètre de l’évaluation"


def mesure(p: Paragraph, mesures: list) -> None:
    """Parse mesure"""
    if is_mesure_title(p):
        uid, nom = split_title(p.text)
        mesures.append(
            {
                "id": uid,
                "nom": nom,
                "description": "",
                "actions": [],
            }
        )
    else:
        mesure = mesures[-1]
        mesure["description"] += f"{p.text}\n\n"


def categorized_action(cat: str) -> Callable:
    """Returns a parser holding the category"""

    def parser(p: Paragraph, mesures: list) -> None:
        mesure = mesures[-1]
        if is_action_title(p):
            weight, name = split_weight(p.text)
            mesure["actions"].append(
                {
                    "nom": name,
                    "points": weight,
                    "categorie": cat,
                    "description": "",
                    "id": f"{mesure['id']}.{len(mesure['actions']) + 1}",
                }
            )
        else:
            action = mesure["actions"][-1]
            text = p.text
            if text.startswith("-") and not text.startswith("- "):
                text = "- " + text[1:]
            action["description"] += f"{text}\n\n"

    return parser


def docx_to_parent_actions(doc: docx.Document) -> list:
    """Returns actions from made from domaine and sous-domaine"""
    actions = []

    for p in iter_paragraphs(doc):
        if is_domaine(p):
            numero, nom = p.text.split(":")
            numero = re.findall(r"\d+", numero)[0]
            action = {"id": numero, "nom": nom.strip(), "actions": []}
            actions.append(action)
        if is_sous_domaine(p):
            domaine = actions[-1]
            text = p.text.strip()
            numero = re.findall(r"\d+.\d+", text)[0]
            nom = text[len(numero) + 1 :]
            action = {"id": numero, "nom": nom.strip()}
            domaine["actions"].append(action)

    return actions


def docx_to_mesures(doc: docx.Document) -> list:
    """Returns mesures from document"""
    parser: Callable = void
    mesures = []
    action_cat = ""

    for p in iter_paragraphs(doc):
        if is_domaine(p) or is_sous_domaine(p):
            parser = void
        if is_mesure_title(p):
            parser = mesure
        elif is_reduction(p):
            parser = void
        elif is_perimeter(p):
            parser = void
        elif is_action_title(p):
            parser = categorized_action(action_cat)
        elif is_action_cat(p):
            action_cat = p.text.lower().strip()
            parser = void

        # print(f'{parser} <- {p.text}')
        parser(p, mesures)

    return mesures


def add_climat_pratic(mesures: List[dict], correspondance: str) -> List[dict]:
    """Add climat pratic theme in mesure"""
    correspondance = pd.read_excel(correspondance, dtype=str, sheet_name=0, header=1)
    correspondance = correspondance.iloc[:, [4, 5]]
    correspondance.columns = ["n", "climat_pratic"]

    for mesure in mesures:

        def find_cc(n: str) -> str:
            try:
                return str(correspondance[correspondance["n"] == n].iat[0, 1]).strip()
            except:
                return ""

        mesure["climat_pratic"] = find_cc(mesure["id"])

    return mesures


def mesure_to_markdown_legacy(mesure: dict) -> str:
    """
    Legacy function used by the extractor cli with the results of `docx_to_mesures`
    todo: docx_to_mesures should be updated to output a dict
          similar to the output of `mesures_generator.build_mesure`
    """
    lines = []

    def add_line(s: str) -> None:
        lines.append(s)

    def clean_climat_pratic(cc: str) -> str:
        cc = cc.strip()
        return cc if cc else "''"

    add_line(f"# {mesure['nom']}")
    add_line("```yaml")
    add_line(f"id: {mesure['id']}")
    add_line(f"climat_pratic: {clean_climat_pratic(mesure['climat_pratic'])}")
    add_line("```")
    if mesure["description"]:
        add_line("## Description")
        add_line(mesure["description"])
    add_line("")
    add_line("## Actions")
    for action in mesure["actions"]:
        add_line(f"### {action['nom']}")
        add_line("```yaml")
        add_line(f"id: {action['id']}")
        add_line(f"points: {action['points']}")
        add_line(f"categorie: {action['categorie']}")
        add_line("```")
        if action["description"]:
            add_line(action["description"])
        add_line("")
        add_line("")

    return "\n".join(lines)


def mesure_to_markdown(mesure: dict) -> str:
    """
    Transform a mesure dict into markdown.

    :parameter mesure is a dict similar to the output of `mesures_generator.build_mesure`
    :returns a markdown string compatible with `mesures_generator.build_mesure` input once parsed as a Document
    """
    return action_to_markdown(mesure, heading=1)
