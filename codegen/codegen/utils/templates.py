from bs4 import BeautifulSoup
from jinja2 import Environment, PackageLoader, select_autoescape


def build_jinja_environment() -> Environment:
    return Environment(
        loader=PackageLoader('codegen', '../templates'),
        autoescape=select_autoescape(
            disabled_extensions=('j2',),
        )
    )


def escape_to_html(string: str) -> str:
    """Escape a string to html using beautiful soup."""
    soup = BeautifulSoup(string, 'html.parser')
    return soup.prettify().replace('\n', '')
