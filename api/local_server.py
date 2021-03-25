import uvicorn
from loguru import logger

from config.configuration import PORT


def run_locally():
    """Run function from poetry"""
    logger.info("Starting application initialization...")
    logger.success("Successfully initialized!")
    logger.info(f"Running uvicorn on {PORT}")

    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True, workers=1)


if __name__ == '__main__':
    run_locally()
