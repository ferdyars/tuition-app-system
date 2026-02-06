#!/bin/bash

# Release script - bumps version and generates changelog from commits since last tag
# Usage: ./scripts/release.sh [major|minor|patch]
# Default: patch

set -e

BUMP_TYPE="${1:-patch}"
PACKAGE_JSON="package.json"

# Validate bump type
if [[ "$BUMP_TYPE" != "major" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "patch" ]]; then
  echo "Error: Invalid bump type '$BUMP_TYPE'. Use: major, minor, or patch"
  exit 1
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: Must be on 'main' branch to release. Currently on '$CURRENT_BRANCH'"
  exit 1
fi

# Ensure working directory is clean
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
echo "Current version: $CURRENT_VERSION"

# Bump version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Get the last tag (or first commit if no tags)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [[ -z "$LAST_TAG" ]]; then
  echo "No previous tags found. Including all commits."
  COMMIT_RANGE="HEAD"
else
  echo "Changes since: $LAST_TAG"
  COMMIT_RANGE="$LAST_TAG..HEAD"
fi

# Generate changelog entries from commits merged into main
DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE"$'\n\n'

# Categorize commits
FEATURES=""
FIXES=""
OTHER=""

while IFS= read -r line; do
  [[ -z "$line" ]] && continue

  if [[ "$line" =~ ^feat ]]; then
    # Remove "feat: " or "feat(scope): " prefix
    MSG=$(echo "$line" | sed 's/^feat\([^)]*\)\?: //')
    FEATURES+="- $MSG"$'\n'
  elif [[ "$line" =~ ^fix ]]; then
    MSG=$(echo "$line" | sed 's/^fix\([^)]*\)\?: //')
    FIXES+="- $MSG"$'\n'
  else
    OTHER+="- $line"$'\n'
  fi
done <<< "$(git log $COMMIT_RANGE --pretty=format:"%s" --reverse)"

if [[ -n "$FEATURES" ]]; then
  CHANGELOG_ENTRY+="### Features"$'\n'
  CHANGELOG_ENTRY+="$FEATURES"$'\n'
fi

if [[ -n "$FIXES" ]]; then
  CHANGELOG_ENTRY+="### Fixes"$'\n'
  CHANGELOG_ENTRY+="$FIXES"$'\n'
fi

if [[ -n "$OTHER" ]]; then
  CHANGELOG_ENTRY+="### Other"$'\n'
  CHANGELOG_ENTRY+="$OTHER"$'\n'
fi

# Update CHANGELOG.md
CHANGELOG_FILE="CHANGELOG.md"

if [[ ! -f "$CHANGELOG_FILE" ]]; then
  echo "# Changelog" > "$CHANGELOG_FILE"
  echo "" >> "$CHANGELOG_FILE"
fi

# Insert new entry after the header
TEMP_FILE=$(mktemp)
{
  head -1 "$CHANGELOG_FILE"
  echo ""
  echo "$CHANGELOG_ENTRY"
  tail -n +2 "$CHANGELOG_FILE"
} > "$TEMP_FILE"
mv "$TEMP_FILE" "$CHANGELOG_FILE"

# Update version in package.json using node
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"

echo ""
echo "=== Release $NEW_VERSION ==="
echo ""
cat "$CHANGELOG_FILE" | head -30
echo ""
echo "---"
echo "Files updated: $PACKAGE_JSON, $CHANGELOG_FILE"
echo ""

# Commit and tag
git add "$PACKAGE_JSON" "$CHANGELOG_FILE"
git commit -m "chore: release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "Release v$NEW_VERSION created!"
echo ""
echo "To push: git push && git push --tags"
