# Testing Guide

## Running Tests

This project uses Vitest for unit and integration testing.

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

- **Unit Tests**: Test individual components and utilities
  - `src/components/__tests__/` - Component tests
  - `src/lib/__tests__/` - Utility function tests
  
- **Integration Tests**: Test page-level functionality
  - `src/pages/__tests__/` - Page component tests

## Test Setup

- **Vitest**: Fast unit test framework
- **React Testing Library**: Testing utilities for React components
- **jsdom**: Browser environment simulation
- **User Event**: Simulate user interactions

## Mocked Dependencies

The test setup automatically mocks:
- Supabase client (auth, database operations)
- Geolocation API
- React Router (useNavigate, useParams)

## Writing New Tests

1. Create test files next to the component: `Component.test.tsx`
2. Use the `renderWithProviders` helper from `@/test/utils`
3. Follow the AAA pattern: Arrange, Act, Assert

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Coverage

Current test coverage includes:
- ✅ Navigation component
- ✅ Sport card component
- ✅ Stat card component
- ✅ Sport selection page
- ✅ Utility functions

## Adding Test Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
