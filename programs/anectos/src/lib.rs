use anchor_lang::prelude::*;

declare_id!("GwfpLkrezJQFnHwNMa3e6PRJ2Q2TvbXC77uWaam3T9zE");

#[program]
pub mod anectos {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
