# GCP Self-Hosted GitHub Runner Setup

This directory contains scripts to deploy a self-hosted GitHub Runner on GCP using **Standard Tier** resources (`e2-standard-2` with 100GB SSD) to ensure performance and avoid disk space issues (`ENOSPC`).

## Prerequisites

1.  **Google Cloud SDK (`gcloud`)**: Installed and authenticated.
2.  **Billing Enabled**: Even for Free Tier, billing must be enabled on the GCP project.
3.  **GitHub PAT**: A Personal Access Token with `repo` scope. You can set this in an `.env` file (recommended) or enter it when prompted.

## Deployment

1.  **Authenticate**:
    ```bash
    gcloud auth login
    gcloud config set project YOUR_PROJECT_ID
    ```

2.  **(Optional) Create .env**:
    Create a `.env` file in the `gcp-runner` directory defining your PAT:
    ```bash
    GITHUB_PAT=your_pat_here
    ```

3.  **Run Deployment Script**:
    ```bash
    cd gcp-runner
    chmod +x deploy.sh startup-script.sh
    ./deploy.sh
    ```

## Architecture Notes

- **Instance Type**: `e2-standard-2` (2 vCPU, 8 GB RAM) - significant performance boost over free tier.
- **Disk**: 100GB `pd-balanced` (SSD) - resolved `ENOSPC` errors during large Docker builds.
- **Ephemerality**: The runner runs *one* job and then shuts down ("Ephemerality by Replacement"). The MIG automatically creates a new instance to replace it.
- **Latency**: Expect 2-3 minutes of latency between jobs as the new VM boots and configures itself.

## Troubleshooting

- **Check Instances**: `gcloud compute instances list`
- **View Serial Output (Logs)**: `gcloud compute instances get-serial-port-output [INSTANCE_NAME] --zone=us-central1-a`
