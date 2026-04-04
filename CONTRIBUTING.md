# Contributing

Thank you for contributing to FinSight API.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
pnpm install
```

3. Start PostgreSQL (Docker recommended):

```bash
docker-compose up -d
```

4. Create and seed the database:

```bash
pnpm run db:push
pnpm run db:seed
```

5. Run the app:

```bash
pnpm run dev
```

## Before Submitting a Pull Request

Run checks locally:

```bash
pnpm run lint
pnpm run test --coverage
pnpm run build
```

## Branch and Commit Guidelines

- Create a feature branch from `master`.
- Keep commits focused and descriptive.
- Reference related issue IDs in commit messages when applicable.

## Pull Request Checklist

- Include a clear summary of changes.
- Add or update tests for behavior changes.
- Update docs when APIs, env vars, or setup changes.
- Ensure CI passes.

## Code Style

- Follow existing TypeScript and project structure conventions.
- Keep modules focused (`routes -> controller -> service`).
- Prefer explicit types and fail-fast validation patterns.

## Reporting Security Issues

Do not open public issues for security vulnerabilities.
Open a private security report through GitHub Security Advisories if available, or contact the maintainers directly.
