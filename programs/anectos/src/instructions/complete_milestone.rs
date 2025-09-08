use anchor_lang::prelude::*;
use crate::{error::AnectosError, state::{Milestone, Project, MilestoneCompleted}};

#[derive(Accounts)]
pub struct CompleteMilestone<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(mut, has_one = owner)]
	pub project: Account<'info, Project>,
}

pub fn handler(ctx: Context<CompleteMilestone>, milestone_index: u8, current_funding: u64) -> Result<()> {
	let project = &mut ctx.accounts.project;
	
	require!((milestone_index as usize) < project.milestones.len(), AnectosError::MilestoneIndexOutOfBounds);
    require!(project.milestones[milestone_index as usize].amount <= current_funding, AnectosError::InsufficientProjectVaultFunds);
	require!(!project.milestones[milestone_index as usize].is_achieved, AnectosError::MilestoneAlreadyCompleted);
	
	project.milestones[milestone_index as usize].is_achieved = true;
	
	emit!(MilestoneCompleted {
		project: project.key(),
		milestone_index,
		milestone_amount: project.milestones[milestone_index as usize].amount,
		timestamp: Clock::get()?.unix_timestamp,
	});
	
    Ok(())
}
