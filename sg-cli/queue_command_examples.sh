#!/bin/bash

# Sample commands to interact with the Queue system that contains voted on games waiting 
# to be re-uploaded

SG_API_KEY='fake-key'
SG_API_URL='"https://scenegames.to/api/v1'

# Get first release in queue waiting for re-upload
# Outputs JSON
# How to filter for a RELEASE NAME: 
# RELEASE_NAME=$(curl -X GET "$SG_API_URL/queue?limit=1" -H "X-Api-Key: $SG_API_KEY" | jq -r '.data | .[] | .name')
curl -X GET "$SG_API_URL/queue?limit=1" -H "X-Api-Key: $SG_API_KEY"

# Clear ALL file hoster download links for release
curl -X DELETE -H "X-API-Key: $SG_API_KEY" "$SG_API_URL/link/$RELEASE_NAME"

# Set last upload date for release
CURRENT_TIME=$(echo $(($(date +%s%N)/1000000)))
curl -X PATCH -H 'Content-Type: application/json' -H "X-API-Key: $SG_API_KEY" -d '{"last_upload":"'"$CURRENT_TIME"'"}' "$SG_API_URL/release/$RELEASE_NAME"

# Remove release from queue
curl -X DELETE -H "X-API-Key: $SG_API_KEY" "$SG_API_URL/queue/$RELEASE_NAME" 



