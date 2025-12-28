# Troubleshooting Guide

This document captures common errors and solutions encountered during the setup and deployment of the Context Analyzer application.

## CI/CD & Google Cloud Deployment

### 1. Artifact Registry Repository Not Found
**Error:**
```
name unknown: Repository "context-checker-repo" not found
```
**Cause:**
The target Artifact Registry repository does not exist in the specified Google Cloud Project. Docker cannot push images to a missing repo.

**Solution:**
Create the repository using the `gcloud` CLI:
```bash
gcloud artifacts repositories create context-checker-repo \
    --project=<PROJECT_ID> \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for Context Analyzer"
```

### 2. Cloud Run Admin API Disabled
**Error:**
```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED: Cloud Run Admin API has not been used in project ... before or it is disabled.
```
**Cause:**
The necessary API was not enabled on the GCP project.

**Solution:**
Enable the API:
```bash
gcloud services enable run.googleapis.com --project=<PROJECT_ID>
```

### 3. Reserved Environment Variable (PORT)
**Error:**
```
ERROR: (gcloud.run.deploy) spec.template.spec.containers[0].env: The following reserved env names were provided: PORT. These values are automatically set by the system.
```
**Cause:**
Attempting to explicitly set the `PORT` environment variable in the `gcloud run deploy` command or GitHub Actions workflow. Cloud Run automatically injects this variable, and manual assignment conflicts with the system.

**Solution:**
Remove `PORT` from the `env_vars` section of your GitHub Actions workflow. Ensure your application listens on the port provided by the `PORT` env var (or defaults to one), but do not try to set it during deployment.

### 4. GitHub Actions Authentication
**Issue:**
Need to authenticate GitHub Actions with Google Cloud securely without hardcoding JSON keys in the repo code.

**Solution:**
Use **Workload Identity Federation (WIF)** or a **Service Account Key** stored as a GitHub Secret (`GCP_CREDENTIALS`).
The `google-github-actions/auth` action supports both via the `credentials_json` input.

### 5. YAML Syntax Errors in Workflow
**Error:**
YAML validation failure due to duplicate keys (e.g., `flags` defined twice).

**Solution:**
Carefully review YAML indentation and ensure keys are unique within their parent scope. Use a linter or IDE validation to catch these before pushing.
