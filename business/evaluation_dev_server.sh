#!/bin/bash
uvicorn evaluation_api:app --reload --host 0.0.0.0 --port 8888
