# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start all apps (NestJS + Vite dev servers)
pnpm build                  # Build all apps for production
pnpm start                  # Start production server

# Testing
pnpm test                   # Run Vitest tests
nx run server:test          # Run Jest tests for server only

# Linting
pnpm lint                   # Lint all projects
pnpm lint:fix               # Fix linting issues

# Database
pnpm prisma:migrate:dev     # Create/apply migrations in development
pnpm prisma:migrate         # Deploy migrations (production)
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:studio          # Open Prisma Studio GUI

# i18n
pnpm messages:extract       # Extract i18n strings
pnpm crowdin:sync           # Sync translations with Crowdin

# Nx utilities
npx nx graph                # View project dependency graph
npx nx affected -t test     # Run tests on affected projects
npx nx affected -t build --base=main  # Build affected projects
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS, Shadcn/Radix UI, React Query, Zustand, Vite
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Monorepo**: Nx workspace with pnpm

### Project Structure
```
apps/
├── server/         # NestJS API (port 3000, API prefix: /api)
├── client/         # React frontend (port 5173)
├── artboard/       # React resume builder (port 6173)
└── graphs/         # Python LangGraph service
libs/
├── dto/            # Shared Data Transfer Objects
├── ui/             # Shadcn/Radix UI components
├── hooks/          # Shared React hooks
├── schema/         # Zod schemas
├── parser/         # Data parsing utilities
└── utils/          # Shared utility functions
tools/
├── prisma/         # Prisma schema & migrations
└── compose/        # Docker Compose files
```

### Client Directory Structure
```
apps/client/src/
├── components/     # Reusable UI components
├── pages/          # Route components
├── stores/         # State management (Zustand)
├── services/       # API services
├── constants/      # Constants
├── hooks/          # Custom hooks
├── router/         # React Router configuration
├── libs/           # External library wrappers
├── locales/        # i18n locale files
├── providers/      # React context providers
└── styles/         # Global styles
```

### Server Directory Structure
```
apps/server/src/
├── auth/           # Authentication logic and modules
├── billing/        # Stripe billing modules
├── config/         # Configuration and environment
├── database/       # Entities, migrations, seeds
├── feature/        # Domain-specific feature modules
├── health/         # Health checks and monitoring
├── mail/           # Email sending logic
├── printer/        # PDF printing services
├── resume/         # Resume management
├── storage/        # File storage (MinIO)
├── translation/    # i18n services
├── types/          # Shared type definitions
└── user/           # User management
```

### Key Entry Points
- Backend: `apps/server/src/main.ts` - Swagger docs at `/api/docs`
- Frontend: `apps/client/src/main.tsx`
- Database schema: `tools/prisma/schema.prisma`

### Authentication
Supports: Email/Password, JWT, GitHub OAuth, Google OAuth, OpenID Connect, 2FA with OTP

## Code Style

### Key Principles
- **Functional components only** (no classes in React)
- **Named exports only** (no default exports)
- **Types over interfaces** (except for extending third-party)
- **String literals over enums** (exception: GraphQL enums)
- **No `any` type allowed**
- **Event handlers over useEffect** for state updates
- **Use early returns** to improve readability
- **Focus on readability** over being performant

### Naming Conventions
- **Files/directories**: kebab-case (`user-profile.component.tsx`)
- **Components/Types**: PascalCase (props suffixed with `Props`)
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Boolean variables**: use verbs (`isLoading`, `hasError`, `canDelete`)
- **Functions**: start with verb (`getUserById`, `handleClick`)
- **Event handlers**: prefix with `handle` (`handleClick`, `handleKeyDown`)
- **No abbreviations** in variable names (use `user` not `u`, `item` not `i`)
  - Exceptions: `i`, `j` for loops; `err` for errors; `ctx` for contexts; `req`, `res`, `next` for middleware

### File Naming Suffixes
```
user-profile.component.tsx
user-profile.styles.ts
user-profile.test.tsx
user.service.ts
user.entity.ts
create-user.dto.ts
```

### Imports
```typescript
// Order: External → Internal (absolute) → Relative
import { useCallback } from 'react';
import { Button } from '@/components/ui';
import { UserCardProps } from './types';

// Use `type` keyword for type imports
import { type User } from './types';
```

### Comments
- Use short-form comments (`//`), NOT JSDoc blocks
- Explain WHY, not WHAT
- Avoid obvious comments that repeat what code does
- Multi-line comments use multiple `//` lines, NOT `/** */` blocks
- Add TODOs for future improvements

```typescript
// ✅ Good - explains business logic
// Apply 15% discount for premium users with orders > $100
const discount = isPremiumUser && orderTotal > 100 ? 0.15 : 0;

// ❌ Bad - obvious comment
// Get all users
const users = await userService.findAll();
```

### Utility Helpers
```typescript
import { isDefined } from '@my-saas/utils';
import { isNonEmptyString, isNonEmptyArray } from '@sniptt/guards';

// Use helpers instead of manual checks
const validItems = items.filter(isDefined);
const hasValue = isDefined(value);
```

### Size Limits
- Components: under 300 lines
- Functions: under 20 instructions
- Classes: under 200 instructions, 10 public methods, 10 properties

### TypeScript Guidelines
```typescript
// ✅ Use types, not interfaces
type User = {
  id: string;
  name: string;
};

// ✅ Use string literal unions, not enums
type UserRole = 'admin' | 'user' | 'guest';

// ✅ Use discriminated unions for type guards
type Result =
  | { type: 'success'; data: User }
  | { type: 'error'; message: string };

// ✅ Generic names should be descriptive
type ApiResponse<TData> = {
  data: TData;
  status: number;
};
```

## React Guidelines

### Component Structure
```typescript
// ✅ Correct - functional component with named export
export const UserProfile = ({ user, onEdit }: UserProfileProps) => {
  const handleEdit = () => onEdit(user.id);

  return (
    <div className="p-4">
      <h1>{user.name}</h1>
      <Button onClick={handleEdit}>Edit</Button>
    </div>
  );
};
```

### State Management
```typescript
// ✅ Use event handlers for state updates
const handleButtonClick = () => {
  setData(newData);
};

// ❌ Avoid useEffect for state updates triggered by user actions
```

### Styling
- Always use Tailwind classes for styling
- Avoid inline styles and CSS files
- Use `class-variance-authority` for component variants

### Accessibility
- Add `tabIndex`, `aria-label`, `onClick`, `onKeyDown` to interactive elements
- Use semantic HTML elements

## NestJS Backend Guidelines

### Module Organization
- One module per main domain/route
- One controller per route
- Services contain business logic and persistence
- DTOs validated with class-validator for inputs
- Guards for permission management

### Structure
```typescript
// ✅ Proper module structure
@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

### Error Handling
- Use custom exception types with meaningful messages
- Global filters for exception handling
- Log errors with context

## Testing Guidelines

### Test Structure (AAA Pattern)
```typescript
describe('UserService', () => {
  describe('when getting user by ID', () => {
    it('should return user data for valid ID', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: '123', name: 'John' };
      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });
  });
});
```

### Testing Principles
- **Test behavior, not implementation** - Focus on what users see/do
- **Use descriptive test names** - "should [behavior] when [condition]"
- **Query by user-visible elements** - text, roles, labels over test IDs
- **Keep tests isolated** - Independent and repeatable
- **Test pyramid** - 70% unit, 20% integration, 10% E2E

### React Component Testing
```typescript
describe('LoginForm', () => {
  it('should display error message for invalid credentials', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Invalid'));
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
  });
});
```

### Test Data Factories
```typescript
const createTestUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});
```

## Nx Workspace

### Dependency Management
- Dependencies managed through `tsconfig.json` path mappings
- Libraries export through `index.ts` barrel files
- Internal imports use `@/` or `@my-saas/` path mappings

### Caching
- Nx caches build outputs and test results
- Use `npx nx affected` to run tasks only on changed projects

## Security Patterns

```typescript
// ✅ CSV Export: Apply security first, then formatting
const safeValue = formatValueForCSV(sanitizeValueForCSVExport(userInput));

// ✅ Input validation before processing
const sanitizedInput = validateAndSanitize(userInput);
const result = processData(sanitizedInput);
```
