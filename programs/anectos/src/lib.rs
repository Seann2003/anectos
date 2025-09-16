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

declare_id!("4Tjq5Em4qauF9DjXjVN2WW6NkM49tScR47czXHekquBp");

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
        project_image_metadata_uri: String,
    ) -> Result<()> {
    create_project::handler(ctx, title, description, round, target_amount, milestone_count, sdg_goals, project_image_metadata_uri)
    }


    pub fn change_project_funding_stage(
        ctx: Context<ChangeProjectFundingStage>,
        new_stage: FundingStage,
    ) -> Result<()> {
    change_project_funding_stage::handler(ctx, new_stage)
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

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    contribute::handler(ctx, amount)
    }

    pub fn close_round(ctx: Context<CloseRound>) -> Result<()> {
    close_round::handler(ctx)
    }

    pub fn distribute_funds_to_owner(ctx: Context<DistributeFundsToOwner>, amount: u64) -> Result<()> {
    distribute_funds_to_owner::handler(ctx, amount)
    }

    pub fn create_round_vault(ctx: Context<CreateRoundVault>) -> Result<()> {
    create_round_vault::handler(ctx)
    }

    pub fn settle_matching_for_project(ctx: Context<SettleMatchingForProject>) -> Result<()> {
    settle_matching_for_project::handler(ctx)
    }

    pub fn set_matching_pool(ctx: Context<SetMatchingPool>) -> Result<()> {
    set_matching_pool::handler(ctx)
    }

    pub fn fund_round_pool(ctx: Context<FundRoundPool>, amount: u64) -> Result<()> {
    fund_round_pool::handler(ctx, amount)
    }

    pub fn fund_project_pool(ctx: Context<FundProjectPool>, amount: u64) -> Result<()> {
    fund_project_pool::handler(ctx, amount)
    }

    pub fn set_area_max(ctx: Context<SetAreaMax>, area_max: u128) -> Result<()> {
    set_area_max::handler(ctx, area_max)
    }

}