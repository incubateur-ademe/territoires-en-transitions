import pathlib

from setuptools import find_packages, setup

packages = find_packages(exclude=[])


HERE = pathlib.Path(__file__).parent

setup(name="realtime", version="0.1", packages=packages, requires=[])
