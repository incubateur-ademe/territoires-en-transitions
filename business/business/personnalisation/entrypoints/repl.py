from lark import Lark

from business.personnalisation.engine.formule import FormuleTransformer, Context, Identite, Reponses
from business.personnalisation.engine.grammar import formule_grammar


def main():
    context = Context(
        identite=Identite(
            localisation=set(),
            population={"moins_de_100000"},
            type={"commune"}
        ),
        reponses=Reponses(
            mobilite_1="OUI",
            mobilite_2="mobilite_2_b"
        )
    )

    parser = Lark(formule_grammar, parser="lalr")
    transformer = FormuleTransformer(context)
    while True:
        try:
            s = input('> ')
        except EOFError:
            break
        tree = parser.parse(s)
        result = transformer.transform(tree)
        print(result)


if __name__ == '__main__':
    main()
