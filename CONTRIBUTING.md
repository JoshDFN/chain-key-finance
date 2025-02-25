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

This project uses GitHub Actions for CI/CD:

- Pushing to the `main` branch automatically deploys to the Internet Computer mainnet
- Pull requests are automatically built and tested
- Manual deployments can be triggered from the Actions tab

### Manual Deployment

To trigger a manual deployment:

1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy to IC" workflow
3. Click "Run workflow"
4. Select the target environment (testnet or mainnet)
5. Click "Run workflow"

## Code Style

- Follow the existing code style in the project
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Run tests locally with `npm test`
