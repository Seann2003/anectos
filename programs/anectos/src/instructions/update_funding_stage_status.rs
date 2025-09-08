use anchor_lang::prelude::*;
use crate::{error::AnectosError, state::FundingRound};

#[derive(Accounts)]
pub struct UpdateFundingStageStatus<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(mut, has_one = owner)]
	pub funding_round: Account<'info, FundingRound>,
}

pub fn handler(ctx: Context<UpdateFundingStageStatus>, is_active: bool) -> Result<()> {
	let round = &mut ctx.accounts.funding_round;
	round.is_active = is_active;
	Ok(())
}
