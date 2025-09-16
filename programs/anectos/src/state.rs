use anchor_lang::prelude::*;
use num_derive::*;

#[account]
#[derive(InitSpace)]
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
    #[max_len(16)]
    pub milestones: Vec<Milestone>,
    pub bump: u8,
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
    Completed,
    Rejected,
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
#[derive(InitSpace)]
pub struct ProjectMeta {
    pub project: Pubkey,
    #[max_len(64)]
    pub title: String,
    #[max_len(512)]
    pub description: String,
    #[max_len(200)]
    pub image_metadata_uri: String,
    pub funding_stage: FundingStage,
    #[max_len(17)]
    pub sdg_goals: Vec<SDGGoals>,
    pub bump: u8,
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
    pub bump: u8,
}

#[account]
pub struct FundingRoundMeta {
    pub nft_metadata_uri: String,
    pub start_time: i64,
    pub end_time: i64,
}

impl FundingRoundMeta {
    pub const INIT_SPACE: usize = 4 + 200 + 8 + 8;
    pub fn space() -> usize {
        8 + 4 + 200 + 8 + 8
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone)]
pub struct Milestone {
    pub amount: u64,       
    pub is_achieved: bool, 
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
