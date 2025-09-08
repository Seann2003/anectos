use anchor_lang::prelude::*;

#[error_code]
pub enum AnectosError {
    #[msg("The funding round is not active.")]
    FundingRoundInactive,
    #[msg("The funding round has already ended.")]
    FundingRoundEnded,
    #[msg("The funding round has not started yet.")]
    FundingRoundNotStarted,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Invalid contribution amount. Amount must be greater than 0.")]
    InvalidContributionAmount,
    #[msg("The project is not whitelisted.")]
    ProjectNotWhitelisted,
    #[msg("The project has already withdrawn funds.")]
    ProjectAlreadyWithdrawn,
    #[msg("Milestone index out of bounds.")]
    MilestoneIndexOutOfBounds,
    #[msg("Milestone has already been completed.")]
    MilestoneAlreadyCompleted,
    #[msg("Insufficient funds in the project vault.")]
    InsufficientProjectVaultFunds,
    #[msg("The funding round is already closed.")]
    FundingRoundAlreadyClosed,
    #[msg("The funding stage status is invalid.")]
    InvalidFundingStageStatus,
}