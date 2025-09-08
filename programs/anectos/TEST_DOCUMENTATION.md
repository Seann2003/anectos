# Anectos Testing Documentation

## Overview

This document describes the comprehensive test suite for the Anectos Solana program, focusing on quadratic funding and milestone-based project management.

## Test Structure

### 1. Unit Tests (`integration_test.rs`)

#### Milestone Calculation Tests

- **`test_milestone_arithmetic_progression`**: Validates that milestones are calculated using arithmetic progression
  - Ensures milestones are in increasing order
  - Verifies total milestone amounts equal the target amount
  - Handles rounding errors correctly

#### Quadratic Funding Tests

- **`test_quadratic_funding_calculation`**: Tests the core quadratic funding algorithm
  - Validates area calculation (sum of square roots)
  - Verifies matching pool calculation (area squared)
  - Example: [100, 64, 36, 25] → areas [10, 8, 6, 5] → total area 29 → matching pool 841

#### Validation Logic Tests

- **`test_milestone_validation_logic`**: Tests milestone completion logic
  - Validates which milestones can be completed with different funding levels
  - Ensures proper funding threshold checks

#### Security & Edge Case Tests

- **`test_contribution_overflow_protection`**: Prevents mathematical overflows
  - Tests large contribution amounts (1 billion+)
  - Validates safe arithmetic operations
- **`test_edge_cases`**: Handles boundary conditions
  - Zero contributions
  - Single milestones
  - Very small contributions

### 2. Integration Tests

#### Complete Workflow Tests

- **`test_complete_project_workflow`**: End-to-end project simulation
  - Creates project with milestones
  - Simulates multiple contributions
  - Calculates quadratic funding
  - Determines completable milestones

#### Multi-Round Testing

- **`test_multiple_funding_rounds`**: Tests various project scales
  - Small projects (500 target, 2 milestones)
  - Medium projects (2000 target, 5 milestones)
  - Large projects (10000 target, 10 milestones)

## Test Results

```
running 7 tests
test integration_tests::test_complete_project_workflow ... ok
test tests::test_contribution_overflow_protection ... ok
test tests::test_milestone_arithmetic_progression ... ok
test tests::test_edge_cases ... ok
test tests::test_milestone_validation_logic ... ok
test tests::test_quadratic_funding_calculation ... ok
test integration_tests::test_multiple_funding_rounds ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## Key Algorithms Tested

### 1. Milestone Calculation (Arithmetic Progression)

```rust
let n = milestone_count as u64;
let step = target_amount / (n * (n + 1) / 2);
for i in 1..=n {
    let amount = step * i;
    milestones.push(Milestone { amount, is_achieved: false });
}
```

### 2. Quadratic Funding Area

```rust
fn calculate_quadratic_area(contributions: &[u64]) -> u128 {
    contributions
        .iter()
        .map(|contribution| (*contribution as f64).sqrt() as u128)
        .sum()
}
```

### 3. Matching Pool Calculation

```rust
let matching_pool = (total_area * total_area) as u64;
```

## Helper Functions

The test suite includes reusable helper functions:

- `calculate_milestones(target_amount, milestone_count)`: Creates milestone array
- `calculate_quadratic_area(contributions)`: Computes quadratic funding area
- `can_complete_milestone(milestone, current_funding)`: Validates milestone completion

## Test Coverage

✅ **Milestone Management**

- Creation with arithmetic progression
- Validation logic
- Completion checks

✅ **Quadratic Funding**

- Area calculation
- Matching pool computation
- Multiple contributor scenarios

✅ **Edge Cases**

- Zero contributions
- Large numbers (overflow protection)
- Single milestones
- Rounding errors

✅ **Integration Scenarios**

- Complete project workflows
- Multiple funding rounds
- Various project scales

## Running Tests

```bash
# Run all tests
cd programs/anectos
cargo test --test integration_test

# Run specific test
cargo test --test integration_test test_quadratic_funding_calculation

# Run with output
cargo test --test integration_test -- --nocapture
```

## Future Test Additions

For on-chain testing, consider adding:

- Cross-Program Invocation (CPI) tests
- Account validation tests
- PDA (Program Derived Address) tests
- Signer authorization tests
- Error condition tests

## Notes

The current test suite focuses on business logic validation using unit tests. For full on-chain testing, frameworks like `solana-program-test` or `anchor-test` would be used, but they require more complex dependency management and were avoided here to prevent version conflicts.

The tests validate the core mathematical and logical operations that power the Anectos platform:

1. Fair milestone distribution using arithmetic progression
2. Quadratic funding calculations for democratic resource allocation
3. Robust validation and edge case handling
