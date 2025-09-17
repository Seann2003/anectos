use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, create_account, CreateAccount};
use crate::state::FundingRound;

#[derive(Accounts)]
pub struct CreateRoundVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    #[account(mut)]
    pub round_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateRoundVault>) -> Result<()> {
    let round = &mut ctx.accounts.funding_round;
    let round_key = round.key();

    let (pda, bump) = Pubkey::find_program_address(
        &[b"round_vault", round_key.as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(pda, ctx.accounts.round_vault.key(), crate::error::AnectosError::Unauthorized);

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(0);

    create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            CreateAccount {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.round_vault.to_account_info(),
            },
            &[&[b"round_vault", round_key.as_ref(), &[bump]][..]],
        ),
        lamports,
        0,
        &system_program::ID,
    )?;

    round.project_vault = ctx.accounts.round_vault.key(); // repurpose field as round_vault
    round.vault_bump = bump;
    Ok(())
}
