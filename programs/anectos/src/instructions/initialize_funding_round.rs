use anchor_lang::prelude::*;
use crate::{state::FundingRound, FundingRoundMeta};

#[derive(Accounts)]
pub struct InitializeFundingRound<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,
	#[account(
        init, 
        payer = owner,
        space = FundingRound::INIT_SPACE + FundingRound::DISCRIMINATOR.len(),
    )]
	pub funding_round: Account<'info, FundingRound>,
    #[account(
        init,
        payer = owner,
        space = FundingRoundMeta::INIT_SPACE + FundingRoundMeta::DISCRIMINATOR.len(),
        seeds = [b"funding_round_metadata", funding_round.key().as_ref()],
        bump
    )]
    pub funding_round_metadata: Account<'info, FundingRoundMeta>,
	pub system_program: Program<'info, System>,
}

pub fn handler(
	ctx: Context<InitializeFundingRound>,
	matching_pool: u64,
	start_time: i64,
	end_time: i64,
	nft_metadata_uri: String,
) -> Result<()> {
	let round = &mut ctx.accounts.funding_round;
	let round_meta = &mut ctx.accounts.funding_round_metadata;

	round.owner = ctx.accounts.owner.key();
	round.matching_pool = matching_pool;
	round.total_donations = 0;
	round.area = 0;
	round.area_max = 0;
	round.contributor_count = 0;
	round.project_vault = Pubkey::default();
	round.vault_bump = 0;
	round.is_active = true;
	round.fee = 0;

	round_meta.nft_metadata_uri = nft_metadata_uri;
	round_meta.start_time = start_time;
	round_meta.end_time = end_time;

	Ok(())
}
