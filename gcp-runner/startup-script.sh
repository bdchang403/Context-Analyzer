#!/bin/bash
# GCP Free Tier GitHub Runner Startup Script
# Optimized for e2-micro (2 vCPU, 1 GB RAM)

set -e

# --- 1. Swap Configuration (Critical for 1GB RAM) ---
echo "Setting up Swap..."
# Create 4GB swap file (standard HDD is slow but necessary)
fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
# Tweak swappiness to prefer swap over OOM kill
sysctl vm.swappiness=60
echo 'vm.swappiness=60' >> /etc/sysctl.conf

# --- 2. Install Dependencies ---
echo "Installing Docker and Git..."
apt-get update
apt-get install -y docker.io git jq curl
systemctl enable --now docker
# Allow default user to run docker if needed (though runner runs as root usually in this script)

# --- 3. Install GitHub Runner ---
echo "Installing GitHub Runner..."
mkdir /actions-runner && cd /actions-runner
# ARM64 or x64? e2-micro is x64.
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# --- 4. Configuration Variables ---
# INJECTED_PAT will be replaced by the deploy script or passed via metadata
GITHUB_REPO="bdchang403/Context-Analyzer"
REPO_URL="https://github.com/${GITHUB_REPO}"
# Metadata server is available on GCP VMs
PAT=$(curl -s -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/github_pat")

if [ -z "$PAT" ]; then
  echo "Error: github_pat metadata not found."
  exit 1
fi

# --- 5. Get Registration Token ---
echo "Fetching Registration Token..."
REG_TOKEN=$(curl -s -X POST -H "Authorization: token ${PAT}" -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/${GITHUB_REPO}/actions/runners/registration-token | jq -r .token)

if [ "$REG_TOKEN" == "null" ]; then
    echo "Failed to get registration token. Check PAT permissions."
    exit 1
fi

# --- 6. Configure & Run (Ephemeral) ---
echo "Configuring Runner..."
# --ephemeral: Runner accepts one job then unconfigures itself
# --name: Unique name based on hostname
# --labels: self-hosted,linux,gcp-micro
export RUNNER_ALLOW_RUNASROOT=1
./config.sh --url ${REPO_URL} --token ${REG_TOKEN} --ephemeral --unattended --name "$(hostname)" --labels "gcp-micro"

echo "Starting Runner..."
# run.sh blocks until the job is done (because of --ephemeral)
./run.sh

# --- 7. Self-Destruct / Replacement ---
echo "Job complete. Shutting down to trigger MIG replacement..."
# Getting the zone
ZONE=$(curl -s -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/zone" | awk -F/ '{print $NF}')
INSTANCE_NAME=$(hostname)

# We use simple shutdown. The MIG should be configured with autohealing or just maintaining size.
# If we shutdown, the MIG sees the instance as TERMINATED and usually restarts it or replaces it depending on config.
# To force replacement (fresh VM), deleting is better, but shutdown is safer for scripts without write-permissions.
# We will assume the MIG interprets "TERMINATED" as "Needs repair/replace".
shutdown -h now
