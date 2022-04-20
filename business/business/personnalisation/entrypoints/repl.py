from business.personnalisation.engine.formule_interpreter import ReponsesInterpreter
from business.personnalisation.models import Reponse
from business.personnalisation.engine.parser import parser


def main():
    interpreter = ReponsesInterpreter([Reponse("question_binaire_1", "NON")])
    while True:
        try:
            s = input("> ")
        except EOFError:
            break
        tree = parser.parse(s)
        result = interpreter.visit(tree)
        print(result)


if __name__ == "__main__":
    main()
