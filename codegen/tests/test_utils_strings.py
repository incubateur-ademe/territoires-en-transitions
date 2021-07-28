from codegen.utils.strings import camel_to_snake


def test_camel_to_snake():
    camel = "SomeClassName"
    snake = "some_class_name"
    assert camel_to_snake(camel) == snake
