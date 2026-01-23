#!/bin/bash

# Upload Image to R2
# Usage: ./scripts/upload-image.sh <local-file> <r2-folder>
# Example: ./scripts/upload-image.sh ./photo.jpg blog/my-post
# Output: https://cdn.autumnsgrove.com/blog/my-post/photo.jpg

set -e

# Configuration
BUCKET_NAME="autumnsgrove-images"
CDN_DOMAIN="cdn.autumnsgrove.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: ./scripts/upload-image.sh <local-file> <r2-folder>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/upload-image.sh ./hero.jpg blog/my-post"
    echo "  ./scripts/upload-image.sh ~/Pictures/dish.png recipes/focaccia"
    echo "  ./scripts/upload-image.sh ./screenshot.png projects/my-app"
    echo "  ./scripts/upload-image.sh ./banner.jpg site"
    echo ""
    echo "Folder structure:"
    echo "  blog/{post-slug}/     - Blog post images"
    echo "  recipes/{recipe-slug}/ - Recipe images"
    echo "  projects/{name}/      - Project screenshots"
    echo "  site/                 - Homepage and general images"
    exit 1
fi

LOCAL_FILE="$1"
R2_FOLDER="$2"

# Check if file exists
if [ ! -f "$LOCAL_FILE" ]; then
    echo -e "${RED}Error: File not found: $LOCAL_FILE${NC}"
    exit 1
fi

# Get filename from path
FILENAME=$(basename "$LOCAL_FILE")

# Build R2 path (remove trailing slash if present)
R2_FOLDER="${R2_FOLDER%/}"
R2_PATH="${R2_FOLDER}/${FILENAME}"

# Build full CDN URL
CDN_URL="https://${CDN_DOMAIN}/${R2_PATH}"

echo -e "${BLUE}Uploading image to R2...${NC}"
echo "  Local file: $LOCAL_FILE"
echo "  R2 path:    $R2_PATH"
echo ""

# Upload using wrangler
npx wrangler r2 object put "${BUCKET_NAME}/${R2_PATH}" --file "$LOCAL_FILE"

echo ""
echo -e "${GREEN}Upload complete!${NC}"
echo ""
echo "CDN URL (copy this):"
echo -e "${GREEN}${CDN_URL}${NC}"
echo ""
echo "Markdown:"
echo "![Alt text](${CDN_URL})"
echo ""
echo "Svelte:"
echo "<img src=\"${CDN_URL}\" alt=\"Description\" />"
