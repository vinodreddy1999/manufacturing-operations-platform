FROM python:3.12-slim AS base

WORKDIR /service
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

FROM base AS test

COPY tests ./tests

CMD ["python", "-m", "pytest"]

FROM base AS runtime

EXPOSE 8100
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
