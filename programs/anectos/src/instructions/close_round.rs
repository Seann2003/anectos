use anchor_lang::prelude::*;
use crate::state::FundingRound;

#[derive(Accounts)]
pub struct CloseRound<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(mut, has_one = owner, close = owner)]
	pub funding_round: Account<'info, FundingRound>,
}

pub fn handler(ctx: Context<CloseRound>) -> Result<()> {
	let round = &mut ctx.accounts.funding_round;
	round.is_active = false;
	Ok(())
}