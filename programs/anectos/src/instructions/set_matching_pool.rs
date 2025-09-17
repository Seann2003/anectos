use anchor_lang::prelude::*;
use crate::state::FundingRound;

#[derive(Accounts)]
pub struct SetMatchingPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    /// Funding round owned by `owner`
    #[account(mut, has_one = owner)]
    pub funding_round: Account<'info, FundingRound>,
    /// PDA SystemAccount for the round vault: seeds = [b"round_vault", funding_round]
    #[account(mut)]
    pub round_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// Sets the round.matching_pool to the current lamports held by the round_vault PDA.
/// This does NOT move any funds; it only updates program state so settlement logic
/// uses the declared pool size. Admin/owner-only.
pub fn handler(ctx: Context<SetMatchingPool>) -> Result<()> {
    let round: &mut Account<'_, FundingRound> = &mut ctx.accounts.funding_round;

    // Validate round_vault is the expected PDA for this round
    let (expected, _bump) = Pubkey::find_program_address(
        &[b"round_vault", round.key().as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(
        expected,
        ctx.accounts.round_vault.key(),
        crate::error::AnectosError::Unauthorized
    );

    let bal = ctx.accounts.round_vault.lamports();
    round.matching_pool = bal as u64;
    Ok(())
}
