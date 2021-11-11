from typing import Dict

import marshmallow_dataclass


def dataclass_from_dict(cls, as_dict: Dict, use_marshmallow: bool):
    if use_marshmallow:
        return marshmallow_dataclass.class_schema(cls)().load(as_dict)
    return cls(**as_dict)
