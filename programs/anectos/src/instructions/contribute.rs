use anchor_lang::prelude::*;
use crate::state::{FundingRound, Project};
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
    pub system_program: Program<'info, System>
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

	project.current_funding = project.current_funding.checked_add(amount).unwrap();

	let sqrt_amount = (amount as f64).sqrt() as u128;
	funding_round.area = funding_round.area.checked_add(sqrt_amount).unwrap();

	funding_round.matching_pool = funding_round.area.checked_mul(funding_round.area).unwrap() as u64;

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
