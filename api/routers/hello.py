from fastapi import APIRouter
from starlette.responses import PlainTextResponse

router = APIRouter(
    prefix="/hello",
)


@router.get("/", description="Get 'Hello!'", response_description="Some text")
async def get():
    return PlainTextResponse("Hello!")
