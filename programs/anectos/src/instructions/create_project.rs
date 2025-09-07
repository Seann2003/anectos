use anchor_lang::prelude::*;
use crate::{state::{Milestone, Project}, FundingStage, ProjectMeta, SDGGoals};

#[derive(Accounts)]
pub struct CreateProject<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(
        init, 
        payer = owner, 
        space = Project::INIT_SPACE + Project::DISCRIMINATOR.len(),
        seeds = [b"project", owner.key().as_ref()],
        bump
    )]
	pub project: Account<'info, Project>,
    #[account(
        init,
        payer = owner,
        space = ProjectMeta::INIT_SPACE + ProjectMeta::DISCRIMINATOR.len(),
        seeds = [b"project_metadata", project.key().as_ref()],
        bump
    )]
    pub project_metadata: Account<'info, ProjectMeta>,
	pub system_program: Program<'info, System>,
}

impl <'info> CreateProject<'info> {
    pub fn calculate_milestones(target_amount: u64, milestone_count: u8) -> Vec<Milestone> {
        let n = milestone_count as u64;
        let step = target_amount / (n * (n + 1) / 2);
        let mut milestones = Vec::new();
        let mut sum = 0;
        for i in 1..=n {
            let amount = step * i;
            milestones.push(Milestone {
                amount,
                is_achieved: false,
            });
            sum += amount;
        }

        if sum != target_amount {
            let diff = target_amount - sum;
            if let Some(last) = milestones.last_mut() {
                last.amount += diff;
            }
        }
        milestones
    }
} 

pub fn handler(
    ctx: Context<CreateProject>,
    title: String,
    description: String,
    round: Pubkey,
    target_amount: u64,
    milestone_count: u8,
    sdg_goals: Vec<SDGGoals>
) -> Result<()> {
    let milestones = CreateProject::calculate_milestones(target_amount, milestone_count);

    let project = &mut ctx.accounts.project;
    let project_metadata = &mut ctx.accounts.project_metadata;

    project.project_id = project.key();
    project.round = round;
    project.owner = ctx.accounts.owner.key();
    project.target_amount = target_amount;
    project.area = 0;
    project.current_funding = 0;
    project.is_whitelisted = false;
    project.has_withdrawn = false;
    project.milestone_count = milestone_count;
    project.milestones = milestones;

    project_metadata.project = project.key();
    project_metadata.title = title;
    project_metadata.description = description;
    project_metadata.funding_stage = FundingStage::Planning;
    project_metadata.sdg_goals = sdg_goals;

    Ok(())
}

