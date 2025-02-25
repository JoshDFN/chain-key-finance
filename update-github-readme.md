# GitHub Update Script

This script helps you easily update your GitHub repository with changes. It's designed to simplify the process of committing and pushing changes to GitHub.

## Usage

```bash
./update-github.sh [options]
```

### Options

- `-p, --path PATH`: Path to the repository (default: current directory)
- `-b, --branch BRANCH`: Branch to push to (default: main)
- `-m, --message MESSAGE`: Commit message (default: 'Update changes')
- `-h, --help`: Show help message

### Examples

1. Basic usage (uses default values):
   ```bash
   ./update-github.sh
   ```

2. Specify a commit message:
   ```bash
   ./update-github.sh -m "Fix bug in login form"
   ```

3. Push to a different branch:
   ```bash
   ./update-github.sh -b feature/new-login -m "Add new login feature"
   ```

## How It Works

1. The script checks if there are any changes to commit
2. It shows you the changes that will be committed
3. It asks for your confirmation before proceeding
4. It adds all changes, commits them with your message, and pushes to GitHub

## Integration with CI/CD

This script works well with the project's CI/CD workflow:

1. Make your changes to the codebase
2. Run this script to commit and push your changes
3. GitHub Actions will automatically verify the build
4. You can then deploy manually from your local machine

## Notes

- This script is designed to be run from within the repository directory
- It requires Git to be installed and configured with your GitHub credentials
- It will only push changes if there are actual changes to commit
