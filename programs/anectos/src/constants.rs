use anchor_lang::prelude::*;

// Following Splurge pattern for constants management
#[constant]
pub const PROJECT_SEED: &[u8] = b"project";
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";
#[constant]
pub const FUNDING_ROUND_SEED: &[u8] = b"funding_round";
#[constant]
pub const PROJECT_METADATA_SEED: &[u8] = b"project_metadata";
#[constant]
pub const FUNDING_ROUND_METADATA_SEED: &[u8] = b"funding_round_metadata";

// Configuration constants
#[constant]
pub const MAX_MILESTONES: u8 = 20;
#[constant]
pub const MAX_TITLE_LEN: u8 = 50;
#[constant]
pub const MAX_DESCRIPTION_LEN: u8 = 200;
#[constant]
pub const MAX_URI_LEN: u8 = 200;
#[constant]
pub const MIN_CONTRIBUTION_AMOUNT: u64 = 1000; // 0.001 SOL minimum