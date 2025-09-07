use anchor_lang::prelude::*;
use crate::state::FundingRound;
use crate::error::AnectosError;

#[derive(Accounts)]
pub struct CloseRound<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(mut, has_one = owner)]
	pub funding_round: Account<'info, FundingRound>,
}

pub fn handler(ctx: Context<CloseRound>) -> Result<()> {
	let round = &mut ctx.accounts.funding_round;
	require!(round.owner == ctx.accounts.owner.key(), AnectosError::Unauthorized);
	round.is_active = false;
	Ok(())
}