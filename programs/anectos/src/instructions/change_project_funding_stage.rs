use anchor_lang::prelude::*;
use crate::state::ProjectMeta;
use crate::FundingStage;

#[derive(Accounts)]
pub struct ChangeProjectFundingStage<'info> {
	#[account(mut)]
	pub user: Signer<'info>,
	#[account(
        mut,
		seeds = [b"project_metadata", project_meta.project.key().as_ref()],
		bump
    )]
	pub project_meta: Account<'info, ProjectMeta>,
}

pub fn handler(ctx: Context<ChangeProjectFundingStage>, funding_stage: FundingStage) -> Result<()> {
	let project_meta = &mut ctx.accounts.project_meta;
	project_meta.funding_stage = funding_stage;
	Ok(())
}