from lark import Lark


parser = Lark.open(
    "./business/personnalisation/engine/grammar.lark",
    parser="lalr",
)
