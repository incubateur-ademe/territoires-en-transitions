from os import environ
import uvicorn


PORT = int(environ.get("PORT", "8888"))


def serve():
    """Run function for Scalingo, see `Procfile`"""
    print(f"Running uvicorn on {PORT}")
    uvicorn.run("api.app:app", host="0.0.0.0", port=PORT, workers=1)


if __name__ == "__main__":
    serve()
