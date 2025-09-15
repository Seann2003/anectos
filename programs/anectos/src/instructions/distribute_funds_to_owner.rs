use anchor_lang::{prelude::*};
use crate::{error::AnectosError, state::{Milestone, Project}};
use anchor_lang::system_program::{transfer, Transfer};


#[derive(Accounts)]
pub struct DistributeFundsToOwner<'info> {
	#[account(mut)]
	pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        has_one = owner,
        seeds = [b"project", owner.key().as_ref()],
        bump
    )]
	pub project: Account<'info, Project>,
    pub system_program: Program<'info, System>
}

pub fn handler(ctx: Context<DistributeFundsToOwner>, amount: u64) -> Result<()> {
    let project = &mut ctx.accounts.project;
    require!(project.owner == ctx.accounts.owner.key(), AnectosError::Unauthorized);
    require!(project.current_funding > 0, AnectosError::InsufficientProjectVaultFunds);

    if project.milestones.get(0).map_or(false, |m| m.is_achieved) {
        let bindings = ctx.accounts.owner.key();
        let signer_seeds = [b"vault", bindings.as_ref(), &[ctx.bumps.vault]];

        let vault_balance = ctx.accounts.vault.lamports();
        require!(vault_balance >= amount, AnectosError::InsufficientProjectVaultFunds);

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                &[&signer_seeds[..]],
            ),
            amount,
        )?;
    }
    Ok(())
}
