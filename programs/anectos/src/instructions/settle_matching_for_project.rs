use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{FundingRound, Project};
use crate::error::AnectosError;

#[derive(Accounts)]
pub struct SettleMatchingForProject<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    /// round vault PDA
    #[account(mut)]
    pub round_vault: SystemAccount<'info>,
    #[account(mut, has_one = owner)]
    pub project: Account<'info, Project>,
    /// project vault PDA (seeds = [b"vault", owner])
    #[account(mut)]
    pub project_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleMatchingForProject>) -> Result<()> {
    let round = &mut ctx.accounts.funding_round;
    let project = &mut ctx.accounts.project;

    // Derive signer seeds for round_vault PDA
    let (expected_vault, bump) = Pubkey::find_program_address(
        &[b"round_vault", round.key().as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(expected_vault, ctx.accounts.round_vault.key(), AnectosError::Unauthorized);

    let round_area = round.area; // sum of sqrt contributions
    let target_area = if round.area_max > 0 { round.area_max } else { round.area };
    let denom_area = core::cmp::max(round_area, target_area);
    let proj_area = project.area;
    // Per-project matching: use the project's own matching pool budget
    let pool_total = project.matching_pool as u128;

    if round_area == 0 || proj_area == 0 || pool_total == 0 {
        return Ok(()); // nothing to do
    }

    // alloc = M * (area_i^2) / sum_j(area_j^2)
    let num = proj_area
        .checked_mul(proj_area)
        .ok_or(AnectosError::InvalidContributionAmount)?;
    let den = denom_area
        .checked_mul(denom_area)
        .ok_or(AnectosError::InvalidContributionAmount)?;
    if den == 0 { return Ok(()); }
    let alloc = pool_total
        .checked_mul(num)
        .ok_or(AnectosError::InvalidContributionAmount)?
        / den;

    let already = project.matching_unlocked as u128;
    if alloc <= already { return Ok(()); }
    let mut delta = alloc - already;

    // Clamp to vault balance and pool remaining
    let rv_balance = ctx.accounts.round_vault.lamports() as u128;
    let pool_remaining = (project.matching_pool as u128)
        .saturating_sub(project.pool_distributed as u128);
    delta = delta.min(rv_balance).min(pool_remaining);
    if delta == 0 { return Ok(()); }

    let round_key_bytes = round.key().to_bytes();
    let seeds = [
        b"round_vault",
        round_key_bytes.as_ref(),
        &[bump],
    ];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.round_vault.to_account_info(),
                to: ctx.accounts.project_vault.to_account_info(),
            },
            &[&seeds[..]],
        ),
        delta as u64,
    )?;

    project.matching_unlocked = project.matching_unlocked.saturating_add(delta as u64);
    project.pool_distributed = project.pool_distributed.saturating_add(delta as u64);
    Ok(())
}
