#!/bin/bash
export SUPABASE_URL=http://127.0.0.1:54321
uvicorn evaluation_api:app --reload --host 0.0.0.0 --port 8888
