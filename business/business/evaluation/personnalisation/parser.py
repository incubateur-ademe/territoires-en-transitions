from lark import Lark


parser = Lark.open(
    "./business/evaluation/personnalisation/grammar.lark",
    parser="lalr",
)
