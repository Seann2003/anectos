use anchor_lang::prelude::*;
use crate::{state::{Milestone, Project, ProjectCreated}, FundingStage, ProjectMeta, SDGGoals};

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        // 8 (discriminator) + Project::INIT_SPACE derived via InitSpace
        space = 8 + Project::INIT_SPACE,
        seeds = [b"project", owner.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = owner,
        // 8 (discriminator) + ProjectMeta::INIT_SPACE derived via InitSpace
        space = 8 + ProjectMeta::INIT_SPACE,
        seeds = [b"project_metadata", project.key().as_ref()],
        bump
    )]
    pub project_metadata: Account<'info, ProjectMeta>,
    pub system_program: Program<'info, System>,
}

impl <'info> CreateProject<'info> {
    pub fn calculate_milestones(target_amount: u64, milestone_count: u8) -> Vec<Milestone> {
        let n = milestone_count as u64;
        let step = if n > 0 { target_amount / (n * (n + 1) / 2) } else { 0 };
        let mut milestones = Vec::new();
        let mut sum: u64 = 0;
        for i in 1..=n {
            let amount = step.saturating_mul(i);
            milestones.push(Milestone {
                amount,
                is_achieved: false,
            });
            sum = sum.saturating_add(amount);
        }

        if sum != target_amount {
            let diff = target_amount.saturating_sub(sum);
            if let Some(last) = milestones.last_mut() {
                last.amount = last.amount.saturating_add(diff);
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
    sdg_goals: Vec<SDGGoals>,
    project_image_metadata_uri: String,
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
    project.matching_unlocked = 0;
    project.matching_pool = 0;
    project.pool_distributed = 0;
    project.is_whitelisted = false;
    project.has_withdrawn = false;
    project.milestone_count = milestone_count;
    project.milestones = milestones;
    project.bump = ctx.bumps.project;

    project_metadata.project = project.key();
    project_metadata.title = title;
    project_metadata.description = description;
    project_metadata.funding_stage = FundingStage::Planning;
    project_metadata.sdg_goals = sdg_goals;
    project_metadata.image_metadata_uri = project_image_metadata_uri;
    project_metadata.bump = ctx.bumps.project_metadata;

    emit!(ProjectCreated {
        project: project.key(),
        owner: ctx.accounts.owner.key(),
        target_amount,
        milestone_count,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

