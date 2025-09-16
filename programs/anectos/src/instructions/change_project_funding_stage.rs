use anchor_lang::prelude::*;
use crate::state::{ProjectMeta, Project, FundingRound};
use crate::{FundingRoundMeta, FundingStage};

#[derive(Accounts)]
pub struct ChangeProjectFundingStage<'info> {
	#[account(mut)]
	pub user: Signer<'info>,
    // Project meta PDA derived from the project account
    #[account(
        mut,
        seeds = [b"project_metadata", project.key().as_ref()],
        bump
    )]
    pub project_meta: Account<'info, ProjectMeta>,
    #[account(
        mut,
        seeds = [b"project", user.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    #[account(
        mut,
        seeds = [b"funding_round_metadata", funding_round.key().as_ref()],
        bump
    )]
    pub funding_round_metadata: Account<'info, FundingRoundMeta>,
}

pub fn handler(ctx: Context<ChangeProjectFundingStage>, funding_stage: FundingStage) -> Result<()> {
	let project_meta = &mut ctx.accounts.project_meta;
	let project = &mut ctx.accounts.project;
    let round = &mut ctx.accounts.funding_round;
    let _round_meta = &mut ctx.accounts.funding_round_metadata;

    project_meta.funding_stage = funding_stage;

    if project_meta.funding_stage == FundingStage::Active {
        project.is_whitelisted = true;
        round.is_active = true;
    }

	Ok(())
}