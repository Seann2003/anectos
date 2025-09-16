use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, create_account, CreateAccount};
use crate::state::FundingRound;

#[derive(Accounts)]
pub struct CreateRoundVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub funding_round: Account<'info, FundingRound>,
    /// PDA to be created: seeds = [b"round_vault", funding_round]
    /// CHECK: This is the round vault PDA system account we create via a SystemProgram CPI.
    /// We validate it by recomputing the PDA and require_keys_eq! before creating/funding it.
    #[account(mut)]
    pub round_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateRoundVault>) -> Result<()> {
    let round = &mut ctx.accounts.funding_round;
    let round_key = round.key();

    // Derive expected PDA and bump
    let (pda, bump) = Pubkey::find_program_address(
        &[b"round_vault", round_key.as_ref()],
        ctx.program_id,
    );
    require_keys_eq!(pda, ctx.accounts.round_vault.key(), crate::error::AnectosError::Unauthorized);

    // Create the system account PDA with 0 space; fund with minimum rent (likely 0) to establish the account
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
