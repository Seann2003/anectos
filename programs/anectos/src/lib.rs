#![allow(unexpected_cfgs)]
#![allow(deprecated)]
#![allow(unused)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("GwfpLkrezJQFnHwNMa3e6PRJ2Q2TvbXC77uWaam3T9zE");

#[program]
pub mod anectos {

    use super::*;

    pub fn create_project(
        ctx: Context<CreateProject>,
        title: String,
        description: String,
        round: Pubkey,
        target_amount: u64,
        milestone_count: u8,
        sdg_goals: Vec<SDGGoals>,
    ) -> Result<()> {
        create_project::handler(ctx, title, description, round, target_amount, milestone_count, sdg_goals)
    }

    pub fn complete_milestone(ctx: Context<CompleteMilestone>, milestone_index: u8, current_funding: u64) -> Result<()> {
        complete_milestone::handler(ctx, milestone_index, current_funding)
    }

    pub fn initialize_funding_round(
        ctx: Context<InitializeFundingRound>,
        matching_pool: u64,
        start_time: i64,
        end_time: i64,
        nft_metadata_uri: String
    ) -> Result<()> {
        initialize_funding_round::handler(ctx, matching_pool, start_time, end_time, nft_metadata_uri)
    }

    pub fn update_project_whitelist(
        ctx: Context<UpdateProjectWhitelist>,
        is_whitelisted: bool,
    ) -> Result<()> {
        update_project_whitelist::handler(ctx, is_whitelisted)
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        contribute::handler(ctx, amount)
    }

    pub fn close_round(ctx: Context<CloseRound>) -> Result<()> {
        close_round::handler(ctx)
    }

    pub fn update_funding_stage_status(
        ctx: Context<UpdateFundingStageStatus>,
        is_active: bool,
    ) -> Result<()> {
        update_funding_stage_status::handler(ctx, is_active)
    }

}