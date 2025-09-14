use anchor_lang::prelude::*;
use num_derive::*;

#[account]
pub struct Project {
	pub project_id: Pubkey,
	pub round: Pubkey,
	pub owner: Pubkey,
	pub target_amount: u64,
	pub area: u128,
	pub current_funding: u64,
	pub is_whitelisted: bool,
	pub has_withdrawn: bool,
    pub milestone_count: u8,
	pub milestones: Vec<Milestone>,
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    FromPrimitive,
    ToPrimitive,
    Copy,
    Clone,
    PartialEq,
    Eq,
    Default,
    InitSpace,
)]
pub enum FundingStage {
    #[default]
    Planning,
    Active,
    Ongoing,
    Completed
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    FromPrimitive,
    ToPrimitive,
    Copy,
    Clone,
    PartialEq,
    Eq,
    Default,
    InitSpace,
)]
pub enum SDGGoals {
    #[default]
    NoPoverty = 1,
    ZeroHunger = 2,
    GoodHealthAndWellBeing = 3,
    QualityEducation = 4,
    GenderEquality = 5,
    CleanWaterAndSanitation = 6,
    AffordableAndCleanEnergy = 7,
    DecentWorkAndEconomicGrowth = 8,
    IndustryInnovationAndInfrastructure = 9,
    ReducedInequalities = 10,
    SustainableCitiesAndCommunities = 11,
    ResponsibleConsumptionAndProduction = 12,
    ClimateAction = 13,
    LifeBelowWater = 14,
    LifeOnLand = 15,
    PeaceJusticeAndStrongInstitutions = 16,
    PartnershipsForTheGoals = 17,
}

#[account]
pub struct ProjectMeta {
    pub project: Pubkey,
    pub title: String,
    pub description: String,
    pub funding_stage: FundingStage,
    pub sdg_goals: Vec<SDGGoals>,
}

#[account]
#[derive(InitSpace)]
pub struct FundingRound {
	pub owner: Pubkey,
	pub matching_pool: u64,
	pub total_donations: u64,
	pub area: u128,
	pub area_max: u128,
	pub contributor_count: u32,
	pub project_vault: Pubkey,
	pub vault_bump: u8,
	pub is_active: bool,
	pub fee: u64,
}

#[account]
pub struct FundingRoundMeta {
    pub nft_metadata_uri: String,
    pub start_time: i64,
    pub end_time: i64,
}

impl FundingRoundMeta {
    pub const INIT_SPACE: usize = 4 + 200 + 8 + 8;
    // 4 bytes for String length prefix, 200 bytes for max String, 8 bytes for each i64
    pub fn space() -> usize {
        8 + // discriminator
        4 + 200 + // nft_metadata_uri String
        8 + // start_time
        8   // end_time
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone)]
pub struct Milestone {
    #[max_len(60)]
    pub amount: u64,       
    pub is_achieved: bool, 
}

impl Project {
    pub const INIT_SPACE: usize = 4 + 60 + 8 + 1; 

    pub fn space(max_milestones: usize) -> usize {
        8 + // discriminator
        32 + // project_id
        32 + // round
        32 + // owner
        8 +  // target_amount
        16 + // area
        8 +  // current_funding
        1 +  // is_whitelisted
        1 +  // has_withdrawn
        (Milestone::INIT_SPACE * max_milestones + 4) +
        1    // milestone_count
    }
}

impl ProjectMeta {
    pub const INIT_SPACE: usize = 4 + 50 + 200 + 1 + (4 * 17);

    pub fn space(max_sdg_goals: usize) -> usize {
        8 + // discriminator
        32 + // project
        (50 + 4) + // title
        (200 + 4) + // description
        1 + // funding_stage
        (ProjectMeta::INIT_SPACE * max_sdg_goals + 4) // sdg_goals
    }
}

#[event]
pub struct ContributionMade {
    pub project: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub new_total_funding: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProjectCreated {
    pub project: Pubkey,
    pub owner: Pubkey,
    pub target_amount: u64,
    pub milestone_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneCompleted {
    pub project: Pubkey,
    pub milestone_index: u8,
    pub milestone_amount: u64,
    pub timestamp: i64,
}
