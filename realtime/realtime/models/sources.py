from typing import Annotated

import rx

from realtime.models.events import Event

RawSource = Annotated[
    rx.typing.Subject[dict, dict], "A source of raw json events coming from supabase"
]
EventSource = Annotated[rx.typing.Subject[Event, Event], "A source of typed events"]
