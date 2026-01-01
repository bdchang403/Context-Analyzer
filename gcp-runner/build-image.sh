#!/bin/bash
# build-image.sh: Automates Golden Image creation
# Usage: ./build-image.sh

# Resolve gcloud path
GCLOUD_BIN="gcloud"
if [ -f "./google-cloud-sdk/bin/gcloud" ]; then
    GCLOUD_BIN="./google-cloud-sdk/bin/gcloud"
fi

PROJECT_ID=$($GCLOUD_BIN config get-value project)
ZONE="us-central1-a"
INSTANCE_NAME="gh-runner-builder"
IMAGE_NAME="gh-runner-golden-image-v1"
IMAGE_FAMILY="gh-runner-image"

echo "Building Golden Image in project $PROJECT_ID..."

# 1. Create temporary instance
echo "Creating temporary builder instance..."
$GCLOUD_BIN compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-standard-4 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-balanced \
    --metadata-from-file=startup-script=./setup-image.sh

echo "Waiting for setup to complete (approx 3-5 mins)..."
# Simple wait loop checking serial port output for "Golden Image Setup Complete"
while true; do
    STATUS=$($GCLOUD_BIN compute instances get-serial-port-output $INSTANCE_NAME --zone=$ZONE 2>&1)
    if echo "$STATUS" | grep -q "Golden Image Setup Complete"; then
        echo "Setup finished successfully."
        break
    fi
    echo -n "."
    sleep 10
done

# 2. Stop Instance
echo "Stopping instance..."
$GCLOUD_BIN compute instances stop $INSTANCE_NAME --zone=$ZONE

# 3. Create Image
echo "Creating image $IMAGE_NAME..."
# Delete image if exists
if $GCLOUD_BIN compute images describe $IMAGE_NAME --project=$PROJECT_ID &>/dev/null; then
    echo "Deleting existing image..."
    $GCLOUD_BIN compute images delete $IMAGE_NAME --project=$PROJECT_ID --quiet
fi

$GCLOUD_BIN compute images create $IMAGE_NAME \
    --project=$PROJECT_ID \
    --source-disk=$INSTANCE_NAME \
    --source-disk-zone=$ZONE \
    --family=$IMAGE_FAMILY

# 4. Cleanup
echo "Cleaning up builder instance..."
$GCLOUD_BIN compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet

echo "Golden Image $IMAGE_NAME created successfully."
