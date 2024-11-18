import json
import logging
from business.evaluation.api import router
from fastapi.exceptions import RequestValidationError
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

logger = logging.getLogger()

app = FastAPI()
app.include_router(router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(json.dumps(exc.errors()))
    return JSONResponse(
        {"errors": exc.errors()}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )
