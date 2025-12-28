# Context Checking Tool

A React-based application designed to optimize agent prompts using advanced "Context Engineering" principles. It features real-time basic analysis and a "Deep Semantic Analysis" mode powered by Google Gemini, acting as an expert "Evaluator Agent".

## Features

-   **Deep Semantic Analysis**: Uses an LLM-as-a-Judge approach to score prompts on Ambiguity (1-5) and Safety (1-5).
-   **Detailed Rubrics**: Provides specific, actionable justifications for every score using a "Consultant" persona.
-   **Contradiction Detection**: Identifies logical conflicts within your prompt.
-   **Docker Ready**: Production-optimized Dockerfile with Nginx, ready for Google Cloud Run (supports dynamic ports).

## Getting Started

### Prerequisites
-   Node.js (v18+ recommended)
-   npm
-   Git

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173`.

## Usage

1.  Enter your prompt in the text area.
2.  Review real-time checks for basic context.
3.  Click **"Run Deep Semantic Analysis"**.
4.  (Optional) Enter your Google Gemini API Key for live analysis, or leave it empty to see a detailed Mock Mode demonstration.
5.  Select your preferred model from the dropdown (Default: `gemini-2.5-pro`).

## Docker Deployment

This application is containerized and ready for deployment to platforms like Google Cloud Run.

### Build the Image
```bash
docker build -t context-checker .
```

### Run Locally
The container listens on port **8080** by default, but respects the `PORT` environment variable.

**Standard Run (Port 8080):**
```bash
docker run -p 8080:8080 context-checker
```

**Custom Port (e.g., 3000):**
```bash
docker run -p 3000:3000 -e PORT=3000 context-checker
```

### Google Cloud Run
1.  **Tag & Push** to Artifact Registry:
    ```bash
    docker tag context-checker us-central1-docker.pkg.dev/<project>/<repo>/context-checker
    docker push us-central1-docker.pkg.dev/<project>/<repo>/context-checker
    ```
2.  **Deploy**:
    ```bash
    gcloud run deploy context-checker-service \
      --image us-central1-docker.pkg.dev/<project>/<repo>/context-checker \
      --allow-unauthenticated
    ```
