#!/bin/bash
# Script to update GitHub with changes

# Set default values
REPO_PATH="$(pwd)"
BRANCH="main"
COMMIT_MESSAGE="Update changes"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--path)
      REPO_PATH="$2"
      shift 2
      ;;
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    -m|--message)
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -p, --path PATH       Path to the repository (default: current directory)"
      echo "  -b, --branch BRANCH   Branch to push to (default: main)"
      echo "  -m, --message MESSAGE Commit message (default: 'Update changes')"
      echo "  -h, --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if the repository exists
if [ ! -d "$REPO_PATH" ]; then
  echo "Error: Repository path '$REPO_PATH' does not exist."
  exit 1
fi

# Change to the repository directory
cd "$REPO_PATH"

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit."
  exit 0
fi

# Show the changes
echo "Changes to commit:"
git status --short

# Prompt for confirmation
read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 0
fi

# Add all changes
git add .

# Commit the changes
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
git push origin "$BRANCH"

echo "Changes successfully pushed to GitHub."
