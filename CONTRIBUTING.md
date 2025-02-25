# Contributing to Teleport

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Create a pull request to `main`
4. Wait for CI checks to pass
5. Request a review
6. Once approved, merge your PR

## Branch Naming Convention

- Feature branches: `feature/short-description`
- Bug fixes: `fix/issue-description`
- Documentation: `docs/what-changed`

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `chore:` for maintenance tasks

## Local Development

### Prerequisites

- Node.js 16+
- DFX 0.14.0+
- Internet Computer Replica (for local development)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/JoshDFN/teleport.git
   cd teleport
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start a local replica:
   ```
   dfx start --background
   ```

4. Deploy the canisters:
   ```
   dfx deploy
   ```

## Deployment

### Local Deployment

```bash
make deploy-local
```

### Testnet Deployment

```bash
make deploy-testnet
```

### Mainnet Deployment

```bash
make deploy-mainnet
```

## CI/CD Pipeline

This project uses GitHub Actions for build verification:

- GitHub Actions verify that the build is valid when pushing to `main` or creating pull requests
- The CI workflow checks that the pre-built files exist and that dependencies can be installed

### Deployment Process

Deployment to the Internet Computer is done manually from a developer's machine:

1. Make sure your changes are committed and pushed to the repository
2. Verify that the GitHub Actions workflow passes successfully
3. Deploy from your local machine using the Makefile commands or DFX CLI

## Code Style

- Follow the existing code style in the project
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Run tests locally with `npm test`
