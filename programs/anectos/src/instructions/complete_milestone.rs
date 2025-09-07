use std::thread::current;

use anchor_lang::prelude::*;
use crate::{error::AnectosError, state::{Milestone, Project}};

#[derive(Accounts)]
pub struct CompleteMilestone<'info> {
	#[account(mut)]
	pub user: Signer<'info>,

	#[account(
        mut, 
    )]
	pub project: Account<'info, Project>,
}

pub fn handler(ctx: Context<CompleteMilestone>, milestone_index: u8, current_funding: u64) -> Result<()> {
	let project = &mut ctx.accounts.project;
	require!(project.owner == ctx.accounts.user.key(), AnectosError::Unauthorized);
	require!((milestone_index as usize) < project.milestones.len(), AnectosError::MilestoneIndexOutOfBounds);
    require!(project.milestones[milestone_index as usize].amount < current_funding, AnectosError::MilestoneIndexOutOfBounds);
	project.milestones[milestone_index as usize].is_achieved = true;
    Ok(())
}
