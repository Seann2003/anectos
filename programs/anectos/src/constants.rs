use anchor_lang::prelude::*;

#[constant]
pub const PROJECT_SEED: &[u8] = b"project";
#[constant]
pub const FUNDING_ROUND_SEED: &[u8] = b"funding_round";
#[constant]
pub const MILESTONE_COUNT: u8 = 10;