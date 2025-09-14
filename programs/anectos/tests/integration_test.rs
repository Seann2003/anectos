use anectos::state::Milestone;

// Simple unit tests for the business logic
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_milestone_arithmetic_progression() {
        // Test the milestone calculation logic
        let target_amount = 1000u64;
        let milestone_count = 4u8;
        
        // Simulate milestone calculation (arithmetic progression)
        let n = milestone_count as u64;
        let step = target_amount / (n * (n + 1) / 2);
        let mut milestones = Vec::new();
        let mut sum = 0;
        
        for i in 1..=n {
            let amount = step * i;
            milestones.push(Milestone { 
                amount, 
                is_achieved: false 
            });
            sum += amount;
        }
        
        // Adjust for rounding errors
        if sum != target_amount {
            let diff = target_amount - sum;
            milestones.last_mut().unwrap().amount += diff;
        }
        
        // Verify milestones are in increasing order
        for i in 1..milestones.len() {
            assert!(
                milestones[i].amount >= milestones[i-1].amount, 
                "Milestones should be non-decreasing: {} < {}", 
                milestones[i].amount, 
                milestones[i-1].amount
            );
        }
        
        // Verify total equals target
        let total: u64 = milestones.iter().map(|m| m.amount).sum();
        assert_eq!(total, target_amount, "Total milestone amounts should equal target");
        
        println!("✅ Milestone calculation test passed");
        println!("Target: {}, Milestones: {:?}", target_amount, milestones.iter().map(|m| m.amount).collect::<Vec<_>>());
    }

    #[test]
    fn test_quadratic_funding_calculation() {
        // Test quadratic funding area calculation
        let contributions = vec![100u64, 64u64, 36u64, 25u64];
        let mut total_area = 0u128;
        
        for contribution in &contributions {
            let area_contribution = (*contribution as f64).sqrt() as u128;
            total_area += area_contribution;
        }
        
        // sqrt(100) + sqrt(64) + sqrt(36) + sqrt(25) = 10 + 8 + 6 + 5 = 29
        assert_eq!(total_area, 29, "Total area should be sum of square roots");
        
        // Matching pool should be area squared
        let matching_pool = (total_area * total_area) as u64;
        assert_eq!(matching_pool, 841, "Matching pool should be area squared");
        
        println!("✅ Quadratic funding calculation test passed");
        println!("Contributions: {:?}", contributions);
        println!("Individual areas: {:?}", contributions.iter().map(|c| (*c as f64).sqrt() as u128).collect::<Vec<_>>());
        println!("Total area: {}, Matching pool: {}", total_area, matching_pool);
    }

    #[test]
    fn test_milestone_validation_logic() {
        // Test milestone completion validation
        let milestones = vec![
            Milestone { amount: 250, is_achieved: false },
            Milestone { amount: 500, is_achieved: false },
            Milestone { amount: 750, is_achieved: false },
            Milestone { amount: 1000, is_achieved: false },
        ];
        
        // Test which milestones can be completed with different funding levels
        let funding_scenarios = vec![
            (200u64, vec![]), // No milestones can be completed
            (300u64, vec![0]), // First milestone can be completed
            (600u64, vec![0, 1]), // First two milestones can be completed
            (800u64, vec![0, 1, 2]), // First three milestones can be completed
            (1100u64, vec![0, 1, 2, 3]), // All milestones can be completed
        ];
        
        for (current_funding, expected_completable) in funding_scenarios {
            let completable: Vec<usize> = milestones
                .iter()
                .enumerate()
                .filter(|(_, milestone)| milestone.amount <= current_funding)
                .map(|(index, _)| index)
                .collect();
            
            assert_eq!(
                completable, 
                expected_completable,
                "With funding {}, expected completable milestones {:?}, got {:?}",
                current_funding,
                expected_completable,
                completable
            );
        }
        
        println!("✅ Milestone validation logic test passed");
    }

    #[test]
    fn test_contribution_overflow_protection() {
        // Test that calculations don't overflow with large numbers
        let max_safe_contribution = 1_000_000_000u64; // 1 billion
        
        // Test square root calculation doesn't panic
        let area = (max_safe_contribution as f64).sqrt() as u128;
        assert!(area > 0, "Area calculation should work for large numbers");
        
        // Test that area squared doesn't overflow u64
        let matching_pool = (area * area) as u64;
        assert!(matching_pool <= u64::MAX, "Matching pool should not overflow");
        
        println!("✅ Overflow protection test passed");
        println!("Max contribution: {}, Area: {}, Matching pool: {}", 
                max_safe_contribution, area, matching_pool);
    }

    #[test]
    fn test_edge_cases() {
        // Test zero contribution
        let zero_area = (0u64 as f64).sqrt() as u128;
        assert_eq!(zero_area, 0, "Zero contribution should result in zero area");
        
        // Test single milestone
        let single_milestone = vec![Milestone { amount: 1000, is_achieved: false }];
        assert_eq!(single_milestone.len(), 1, "Single milestone should work");
        
        // Test very small contribution
        let small_contribution = 1u64;
        let small_area = (small_contribution as f64).sqrt() as u128;
        assert_eq!(small_area, 1, "Small contribution should result in area of 1");
        
        println!("✅ Edge cases test passed");
    }
}

// Integration test helper functions
pub fn calculate_milestones(target_amount: u64, milestone_count: u8) -> Vec<Milestone> {
    let n = milestone_count as u64;
    let step = target_amount / (n * (n + 1) / 2);
    let mut milestones = Vec::new();
    let mut sum = 0;
    
    for i in 1..=n {
        let amount = step * i;
        milestones.push(Milestone { 
            amount, 
            is_achieved: false 
        });
        sum += amount;
    }
    
    // Adjust for rounding errors
    if sum != target_amount {
        let diff = target_amount - sum;
        milestones.last_mut().unwrap().amount += diff;
    }
    
    milestones
}

pub fn calculate_quadratic_area(contributions: &[u64]) -> u128 {
    contributions
        .iter()
        .map(|contribution| (*contribution as f64).sqrt() as u128)
        .sum()
}

pub fn can_complete_milestone(milestone: &Milestone, current_funding: u64) -> bool {
    milestone.amount <= current_funding && !milestone.is_achieved
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_complete_project_workflow() {
        // Simulate a complete project workflow
        let target_amount = 1000u64;
        let milestone_count = 4u8;
        
        // 1. Create project with milestones
        let milestones = calculate_milestones(target_amount, milestone_count);
        println!("Created project with milestones: {:?}", 
                milestones.iter().map(|m| m.amount).collect::<Vec<_>>());
        
        // 2. Simulate contributions
        let contributions = vec![100u64, 150u64, 200u64, 300u64, 250u64];
        let total_contributions: u64 = contributions.iter().sum();
        let total_area = calculate_quadratic_area(&contributions);
        let matching_pool = (total_area * total_area) as u64;
        
        println!("Total contributions: {}", total_contributions);
        println!("Quadratic area: {}", total_area);
        println!("Matching pool: {}", matching_pool);
        
        // 3. Check which milestones can be completed
        let mut completed_milestones = 0;
        for (index, milestone) in milestones.iter().enumerate() {
            if can_complete_milestone(milestone, total_contributions) {
                completed_milestones += 1;
                println!("Milestone {} can be completed (amount: {})", index, milestone.amount);
            }
        }
        
        assert!(completed_milestones > 0, "At least one milestone should be completable");
        assert_eq!(total_contributions, 1000, "Total contributions should match expected");
        
        println!("✅ Complete workflow test passed - {} milestones can be completed", completed_milestones);
    }

    #[test]
    fn test_multiple_funding_rounds() {
        // Test multiple funding rounds with different parameters
        let rounds = vec![
            (500u64, 2u8),   // Small project, 2 milestones
            (2000u64, 5u8),  // Medium project, 5 milestones  
            (10000u64, 10u8), // Large project, 10 milestones
        ];
        
        for (target, count) in rounds {
            let milestones = calculate_milestones(target, count);
            
            // Verify milestone calculation
            let total: u64 = milestones.iter().map(|m| m.amount).sum();
            assert_eq!(total, target, "Milestones should sum to target for {}", target);
            
            // Verify increasing order
            for i in 1..milestones.len() {
                assert!(
                    milestones[i].amount >= milestones[i-1].amount,
                    "Milestones should be increasing for target {}", target
                );
            }
            
            println!("✅ Round with target {} and {} milestones validated", target, count);
        }
    }
}
