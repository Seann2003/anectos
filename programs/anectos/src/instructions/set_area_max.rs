use anchor_lang::prelude::*;
use crate::state::FundingRound;
use crate::error::AnectosError;

#[derive(Accounts)]
pub struct SetAreaMax<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner)]
    pub funding_round: Account<'info, FundingRound>,
}

pub fn handler(ctx: Context<SetAreaMax>, area_max: u128) -> Result<()> {
    // Allow owner to set a target saturation area used to scale matching allocation
    // No additional constraints; area_max can be zero to disable scaling.
    let round = &mut ctx.accounts.funding_round;
    round.area_max = area_max;
    Ok(())
}
