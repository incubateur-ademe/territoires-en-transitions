from jinja2 import Environment, PackageLoader, select_autoescape


def build_jinja_environment() -> Environment:
    return Environment(
        loader=PackageLoader('codegen', '../templates'),
        autoescape=select_autoescape(
            disabled_extensions=('j2',),
        )
    )
