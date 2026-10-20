FROM python:3.12-slim AS backend

# The working directory inside the backend container
WORKDIR /app

COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application into the image
COPY backend/ .

# Django listens on port 8000 inside the container
EXPOSE 8000

# Apply database migrations, then start Django
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]



FROM node:24-bookworm AS frontend

# The working directory inside the frontend container
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

# Install the exact dependency versions from package-lock.json
RUN npm ci

# Copy the remaining frontend source code
COPY frontend/ .

# Vite uses this URL for API requests made by the browser
ENV VITE_API_BASE_URL=http://localhost:8000/api

# Vite's development server listens on port 5173
EXPOSE 5173

# Start Vite so it accepts connections from outside this container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]