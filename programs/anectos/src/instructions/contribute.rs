use anchor_lang::prelude::*;
use crate::state::{FundingRound, Project, Contribution};
use crate::error::AnectosError;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::ContributionMade;

#[derive(Accounts)]
pub struct Contribute<'info> {
	#[account(mut)]
	pub funding_round: Account<'info, FundingRound>,
	#[account(
        mut,
        seeds = [b"project", project.owner.key().as_ref()],
        bump
    )]
	pub project: Account<'info, Project>,
        #[account(
        mut,
        seeds = [b"vault", project.owner.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
	pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// Per-project-per-contributor record: seeds = [b"contrib", project, user]
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [b"contrib", project.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,
}

pub fn handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
	require!(amount > 0, AnectosError::InvalidContributionAmount);
	
	let funding_round = &mut ctx.accounts.funding_round;
	let project = &mut ctx.accounts.project;
	
	require!(funding_round.is_active, AnectosError::FundingRoundInactive);

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    project.current_funding = project
        .current_funding
        .checked_add(amount)
        .ok_or(AnectosError::InvalidContributionAmount)?;

    // Integer sqrt for deterministic quadratic funding accumulation
    fn isqrt_u128(x: u128) -> u128 {
        if x == 0 { return 0; }
        let mut z = (x + 1) >> 1;
        let mut y = x;
        while z < y {
            y = z;
            z = (x / z + z) >> 1;
        }
        y
    }
    // True QF: area accumulates sqrt(total_per_contributor). Add delta = sqrt(prev+amt) - sqrt(prev)
    let contrib = &mut ctx.accounts.contribution;
    let prev = contrib.total_contributed as u128;
    let new_total = prev.checked_add(amount as u128).unwrap();
    let delta = isqrt_u128(new_total).saturating_sub(isqrt_u128(prev));
    contrib.total_contributed = (new_total as u64);
    project.area = project.area.checked_add(delta).unwrap();
    funding_round.area = funding_round.area.checked_add(delta).unwrap();

    // Note: matching_pool represents total pool size and should NOT be recomputed here
	funding_round.total_donations = funding_round.total_donations.checked_add(amount).unwrap();

	funding_round.contributor_count = funding_round.contributor_count.checked_add(1).unwrap();

    emit!(ContributionMade {
        project: project.key(),
        contributor: ctx.accounts.user.key(),
        amount,
        new_total_funding: project.current_funding,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
	Ok(())
}
