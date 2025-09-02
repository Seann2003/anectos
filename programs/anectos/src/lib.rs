#![allow(unexpected_cfgs)]
#![allow(deprecated)]
#![allow(unused)]
use anchor_lang::prelude::*;

declare_id!("GwfpLkrezJQFnHwNMa3e6PRJ2Q2TvbXC77uWaam3T9zE");

#[program]
pub mod anectos {
    use super::*;

    pub fn create_project(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_funding_round(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn update_project_whitelist(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn contribute(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn add_milestones(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn complete_milestone(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn withdraw(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn close_round(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn update_funding_stage_status(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

}

