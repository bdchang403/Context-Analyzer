# Troubleshooting Guide

This document captures common errors and solutions encountered during the setup, development, and deployment of the Context Analyzer application.

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

## Local Development: Debugging "Blank Page of Death"

A summary of lessons learned from debugging the Context-Checking Tool. Use this guide when the app server starts but the browser shows a white screen or fails to load.

### The 4-Step Troubleshooting Protocol

#### 1. The "Default Port" Trap (Port Drift)
**Symptom**: App opens on port `5174` instead of `5173`. Bookmarks break.
**Cause**: The default port was occupied (zombie process), so Vite incremented the port.
**Fix**: Enforce strict port in `vite.config.js`.

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true, // Fail if 5173 is busy (prevents drift)
  }
})
```

#### 2. The 20-Second Delay (IPv6 Timeout)
**Symptom**: App loads... eventually. Or times out completely (Blank Page).
**Cause**: Node.js/Linux often tries to resolve `localhost` via IPv6 (`::1`) first. If strict IPv6 isn't configured correctly, it hangs for 20s before falling back to IPv4.
**Fix**: Force IPv4 host binding.

```javascript
// vite.config.js
server: {
  host: '127.0.0.1', // Bypasses DNS resolution lag
}
```

#### 3. The "Silent Crash" (Import Errors)
**Symptom**: Instant white screen. Error Boundary does **NOT** show.
**Cause**: Static import errors (e.g., typos in `import { Typo } from 'lib'`).
**Why**: Static imports are evaluated *before* any code runs. If they fail, the browser script crashes entirely before React mounts.
**Detection**:
- **Do not inspect browser console** (it can be misleadingly empty if the script file 404s or fails to parse).
- **Run `npm run build`**. The compiler will catch these errors immediately even if the dev server swallows them.

```bash
npm run build
# Output: "Alertoctagon" is not exported by "lucide-react"
```

#### 4. The "React Crash" (Runtime Errors)
**Symptom**: White screen. Console has red stack traces.
**Cause**: Code logic error inside a component.
**Fix**: Wrap your app in a global Error Boundary in `main.jsx` to see the error on-screen.

```javascript
// src/main.jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error) { console.error(error); }
  render() {
    if (this.state.hasError) return <h1>Something went wrong</h1>;
    return this.props.children;
  }
}
```

### The "Nuclear Option": Vanilla JS Isolation
If you are unsure if the problem is the Code, the Server, or the Browser:
1. **Delete/Rename** `src/main.jsx`.
2. **Create a new `src/main.jsx`** with only:
   ```javascript
   document.body.innerHTML = "<h1>IT WORKS</h1>";
   ```
3. **Test**.
   - If it works: Your React app is broken (Outcome 3 or 4).
   - If it fails: Your Server/Environment is broken (Outcome 1 or 2).
