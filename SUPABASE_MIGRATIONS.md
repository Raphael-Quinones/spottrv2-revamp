# Supabase CLI Migration Guide

## Prerequisites
- Supabase CLI installed (`npm install -g supabase` or use `npx supabase`)
- Docker running (for local development)
- Project credentials (project ID, database password)

## Environment Setup

### 1. Create .env file in project root
```bash
# .env
SUPABASE_DB_PASSWORD='your_database_password'
SUPABASE_PROJECT_ID='your_project_ref'
```

**Note:** Keep .env in project root directory, not in supabase/ folder. The CLI automatically loads it from root.

## Migration Commands

### Initial Setup
```bash
# Initialize Supabase in your project
npx supabase init

# Link to remote project (first time only)
export SUPABASE_DB_PASSWORD='your_password_here' && \
npx supabase link --project-ref your_project_ref
```

### Creating Migrations

#### Option 1: Auto-generate from schema changes
```bash
# Make changes in Supabase dashboard, then pull them
npx supabase db pull

# This creates: supabase/migrations/<timestamp>_remote_schema.sql
```

#### Option 2: Manual migration files
```bash
# Create empty migration file
npx supabase migration new your_migration_name

# Edit the file in supabase/migrations/<timestamp>_your_migration_name.sql
```

### Applying Migrations

#### To Remote Database
```bash
# Push all pending migrations
export SUPABASE_DB_PASSWORD='your_password_here' && \
npx supabase db push

# Dry run (preview without applying)
export SUPABASE_DB_PASSWORD='your_password_here' && \
npx supabase db push --dry-run
```

#### To Local Database
```bash
# Start local Supabase
npx supabase start

# Reset and reapply all migrations
npx supabase db reset
```

## Common Workflows

### 1. Pull Remote Changes → Develop Locally → Push
```bash
# Pull latest from remote
npx supabase db pull

# Start local development
npx supabase start

# Make changes and test locally
# Create new migration
npx supabase migration new feature_name

# Test migration locally
npx supabase db reset

# Push to remote
export SUPABASE_DB_PASSWORD='your_password_here' && \
npx supabase db push
```

### 2. CI/CD Pipeline
```bash
# Set environment variables in CI
export SUPABASE_ACCESS_TOKEN='your_access_token'
export SUPABASE_DB_PASSWORD='your_database_password'
export SUPABASE_PROJECT_ID='your_project_ref'

# Link and push migrations
npx supabase link --project-ref $SUPABASE_PROJECT_ID
npx supabase db push
```

## Special Characters in Password

If your password contains special characters like `&`, `*`, `(`, `)`, etc.:

```bash
# Use single quotes and export
export SUPABASE_DB_PASSWORD='asdfASDF789&*('

# Or escape in double quotes
export SUPABASE_DB_PASSWORD="asdfASDF789\&\*\("
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check Docker permissions: `docker ps`

### "Database password required"
- Set `SUPABASE_DB_PASSWORD` environment variable
- Or use `--password` flag with the command

### "Project not linked"
- Run `npx supabase link --project-ref your_project_ref` first
- Check `.supabase/` folder exists with project config

### "Remote database is up to date"
- No pending migrations to apply
- Check `supabase/migrations/` for new files
- Ensure migration files have correct timestamp format

## Best Practices

1. **Always test migrations locally first**
   ```bash
   npx supabase db reset  # Applies all migrations to local DB
   ```

2. **Use version control for migrations**
   - Commit all files in `supabase/migrations/`
   - Never modify existing migration files
   - Create new migrations for changes

3. **Review before pushing**
   ```bash
   # Always do a dry run first
   npx supabase db push --dry-run
   ```

4. **Keep migrations small and focused**
   - One feature per migration
   - Makes rollbacks easier
   - Better for debugging

5. **Document migrations**
   ```sql
   -- Migration: Add user preferences table
   -- Author: Your Name
   -- Date: 2025-01-13
   -- Purpose: Store user UI preferences
   ```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx supabase init` | Initialize Supabase in project |
| `npx supabase link` | Connect to remote project |
| `npx supabase db push` | Apply migrations to remote |
| `npx supabase db pull` | Pull remote schema changes |
| `npx supabase db reset` | Reset local DB with migrations |
| `npx supabase migration new` | Create new migration file |
| `npx supabase db diff` | Show schema differences |
| `npx supabase status` | Check local environment status |

## Migration File Naming

Migration files follow this pattern:
```
<timestamp>_<descriptive_name>.sql
```

Example:
```
20240113143022_add_user_preferences.sql
```

The timestamp ensures migrations run in the correct order.