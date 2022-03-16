from lark import Transformer
import operator


class MathTransformer(Transformer):
    @staticmethod
    def number(n):
        return float(*n)

    @staticmethod
    def mul(n):
        return operator.mul(*n)

    @staticmethod
    def div(n):
        return operator.truediv(*n)

    @staticmethod
    def add(n):
        return operator.add(*n)

    @staticmethod
    def sub(n):
        return operator.sub(*n)
