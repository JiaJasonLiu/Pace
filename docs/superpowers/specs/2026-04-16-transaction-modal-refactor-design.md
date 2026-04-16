# TransactionModal Refactor — Extract useTransactionForm Hook

## Goal

Separate form state and logic from rendering in `TransactionModal` by extracting a `useTransactionForm` hook. The public API of `TransactionModal` remains unchanged so no call sites need updating.

## Problem

`TransactionModal` mixes form state (10+ `useState` hooks), reset logic, derived state, and event handlers directly in the component. This makes it hard to read, test, or change independently.

## Approach: Option A — Extract `useTransactionForm`

### New file: `src/components/useTransactionForm.ts`

Owns all logic currently inline in `TransactionModal`:

- All `useState` fields: `amount`, `displayAmount`, `type`, `category`, `description`, `date`, `walletId`, `recurrence`, `status`, `isFixedCost`
- The `formSessionKey` derivation and reset `useEffect`
- The `isFutureDate` derived value
- `handleTypeChange` handler
- `handleSubmit` handler (receives `onSave` and `onClose` as arguments)
- `formatAmountWithCommas` helper (module-level, same file)

Returns a single object with all state values, setters, and handlers needed by `TransactionModal`.

### Updated: `src/components/TransactionModal.tsx`

- Calls `useTransactionForm(props)` at the top
- Renders the JSX using values from the hook
- Contains no business logic or state

### Unchanged

- `src/components/types.ts` — `TransactionModalProps` stays as-is
- `src/pages/Spending/SpendingView.tsx` — no changes
- `src/pages/Settings/components/RecurringSettings.tsx` — no changes

## Success Criteria

- `TransactionModal` renders identically before and after
- `useTransactionForm` has no JSX — pure logic
- All existing behaviour (iOS autoFocus, formSessionKey reset guard, future date status toggle) is preserved
