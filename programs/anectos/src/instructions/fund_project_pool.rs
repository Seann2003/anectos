use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{FundingRound, Project};
use crate::error::AnectosError;

#[derive(Accounts)]
pub struct FundProjectPool<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    #[account(mut)]
    pub project: Account<'info, Project>,
    /// Round vault PDA for deposit: seeds = [b"round_vault", funding_round]
    #[account(mut)]
    pub round_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FundProjectPool>, amount: u64) -> Result<()> {
    require!(amount > 0, AnectosError::InvalidContributionAmount);
    let round = &ctx.accounts.funding_round;
    let project = &mut ctx.accounts.project;

    // Validate project belongs to round
    require_keys_eq!(project.round, round.key(), AnectosError::Unauthorized);

    // Validate PDAs for sanity
    let (expected_rv, _) = Pubkey::find_program_address(
        &[b"round_vault", round.key().as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(expected_rv, ctx.accounts.round_vault.key(), AnectosError::Unauthorized);

    // Move funds from funder to ROUND vault (pool is held centrally; accounting is per-project)
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.funder.to_account_info(),
                to: ctx.accounts.round_vault.to_account_info(),
            },
        ),
        amount,
    )?;

    // Increase the project's own matching pool budget
    project.matching_pool = project
        .matching_pool
        .checked_add(amount)
        .ok_or(AnectosError::InvalidContributionAmount)?;

    Ok(())
}
