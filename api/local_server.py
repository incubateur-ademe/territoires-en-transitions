import uvicorn
from loguru import logger

from config.configuration import FASTAPI_PORT


def run_locally():
    """Run function from poetry"""
    logger.info("Starting application initialization...")
    logger.success("Successfully initialized!")
    logger.info(f"Running uvicorn on {FASTAPI_PORT}")

    uvicorn.run("api.app:app", host="0.0.0.0", port=FASTAPI_PORT, reload=True, workers=1)


if __name__ == '__main__':
    run_locally()
