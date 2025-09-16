use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::FundingRound;
use crate::error::AnectosError;

#[derive(Accounts)]
pub struct FundRoundPool<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    #[account(mut)]
    pub round_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FundRoundPool>, amount: u64) -> Result<()> {
    require!(amount > 0, AnectosError::InvalidContributionAmount);
    let round = &mut ctx.accounts.funding_round;

    // Validate the round_vault PDA
    let (expected_vault, _bump) = Pubkey::find_program_address(
        &[b"round_vault", round.key().as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(expected_vault, ctx.accounts.round_vault.key(), AnectosError::Unauthorized);

    // Move lamports from funder to round_vault
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

    // Increment declared pool to stay in sync with vault deposits
    round.matching_pool = round
        .matching_pool
        .checked_add(amount)
        .ok_or(AnectosError::InvalidContributionAmount)?;

    Ok(())
}
