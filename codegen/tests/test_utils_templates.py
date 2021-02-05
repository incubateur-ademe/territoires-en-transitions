from codegen.utils.templates import build_jinja_environment


def test_build_jinja_environment():
    env = build_jinja_environment()
    value = 'test'
    template = env.get_template('tests/single_value.j2')
    rendered = template.render(value=value)
    assert rendered == value
