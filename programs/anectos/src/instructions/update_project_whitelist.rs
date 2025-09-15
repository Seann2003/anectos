use anchor_lang::prelude::*;
use crate::{error::AnectosError, state::Project};

#[derive(Accounts)]
pub struct UpdateProjectWhitelist<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(
		mut,
		has_one = owner,
		seeds = [b"project", owner.key().as_ref()],
		bump
	)]
	pub project: Account<'info, Project>,
}

pub fn handler(ctx: Context<UpdateProjectWhitelist>, is_whitelisted: bool) -> Result<()> {
	let project = &mut ctx.accounts.project;
	project.is_whitelisted = is_whitelisted;
	Ok(())
}
