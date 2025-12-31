# GCP Free Tier GitHub Runner Setup

This directory contains scripts to deploy a self-hosted GitHub Runner on GCP Free Tier (`e2-micro`) using a Managed Instance Group (MIG).

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

- **Instance Type**: `e2-micro` (2 vCPU, 1 GB RAM).
- **Swap**: 4GB swap file created on boot to prevent OOM.
- **Ephemerality**: The runner runs *one* job and then shuts down ("Ephemerality by Replacement"). The MIG automatically creates a new instance to replace it.
- **Latency**: Expect 2-3 minutes of latency between jobs as the new VM boots and configures itself.

## Troubleshooting

- **Check Instances**: `gcloud compute instances list`
- **View Serial Output (Logs)**: `gcloud compute instances get-serial-port-output [INSTANCE_NAME] --zone=us-central1-a`
