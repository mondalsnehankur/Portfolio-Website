# Portfolio AI Evaluator API

This optional FastAPI service provides model-generated evaluation. The static portfolio works without it and provides a transparent rule-based diagnostic. Never put `GEMINI_API_KEY` in frontend JavaScript or a public repository.

## Run locally
1. Create a virtual environment and install `pip install -r requirements.txt`.
2. Set `GEMINI_API_KEY` as an environment variable (or use a private `.env` with a dotenv loader if you add one).
3. Set `ALLOWED_ORIGINS` to your exact GitHub Pages origin.
4. Run `uvicorn main:app --host 0.0.0.0 --port 8000`.
5. In the portfolio AI Review section, enter `http://localhost:8000/evaluate` for local testing.

Deploy this folder as a separate Python web service (Render/Railway or equivalent), set the environment variables in the host dashboard, and enter the deployed `/evaluate` URL in the portfolio. Restrict CORS to your real portfolio origin. The backend does not persist submitted portfolio text.

The model is called server-side through Google's Gemini generateContent API. Review the provider's current pricing, data handling terms, model availability, and API documentation before production use.
