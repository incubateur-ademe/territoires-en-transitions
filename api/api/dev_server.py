import uvicorn
from loguru import logger

from api.config.configuration import PORT


def serve():
    """Run function for local development with reload enabled."""
    logger.info(f"Running uvicorn on {PORT}")
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True, workers=1)


if __name__ == '__main__':
    serve()
