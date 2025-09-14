use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{Keypair, Signature},
        system_program,
        sysvar::rent,
    },
    Client, Cluster,
};
use anchor_lang::prelude::*;
use anyhow::Result;
use clap::{Arg, Command};
use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID;
use spl_associated_token_account::get_associated_token_address;
use spl_token::ID as TOKEN_PROGRAM_ID;
use std::str::FromStr;

// Your program ID
const ANECTOS_PROGRAM_ID: &str = "26yr8seqaSUEJidnG6yif5W6Fgm84MfkC7UP7ZNAjwgj";

#[derive(Debug)]
struct TokenCreationArgs {
    name: String,
    symbol: String,
    uri: String,
    decimals: u8,
    initial_supply: u64,
    cluster: Cluster,
    keypair_path: String,
}

fn main() -> Result<()> {
    let matches = Command::new("anectos-token-creator")
        .version("1.0")
        .author("Anectos Team")
        .about("Create SPL tokens with Metaplex metadata for Anectos platform")
        .subcommand(
            Command::new("create-fungible")
                .about("Create a fungible SPL token")
                .arg(
                    Arg::new("name")
                        .long("name")
                        .value_name("NAME")
                        .help("Token name")
                        .required(true),
                )
                .arg(
                    Arg::new("symbol")
                        .long("symbol")
                        .value_name("SYMBOL")
                        .help("Token symbol")
                        .required(true),
                )
                .arg(
                    Arg::new("uri")
                        .long("uri")
                        .value_name("URI")
                        .help("Token metadata URI")
                        .required(true),
                )
                .arg(
                    Arg::new("decimals")
                        .long("decimals")
                        .value_name("DECIMALS")
                        .help("Number of decimals")
                        .default_value("9"),
                )
                .arg(
                    Arg::new("supply")
                        .long("supply")
                        .value_name("SUPPLY")
                        .help("Initial supply (in whole tokens)")
                        .default_value("1000000"),
                )
                .arg(
                    Arg::new("cluster")
                        .long("cluster")
                        .value_name("CLUSTER")
                        .help("Solana cluster")
                        .default_value("devnet")
                        .possible_values(["mainnet", "devnet", "testnet", "localnet"]),
                )
                .arg(
                    Arg::new("keypair")
                        .long("keypair")
                        .value_name("KEYPAIR_PATH")
                        .help("Path to keypair file")
                        .default_value("~/.config/solana/id.json"),
                ),
        )
        .subcommand(
            Command::new("create-acts")
                .about("Create ACTS governance token with predefined settings")
                .arg(
                    Arg::new("cluster")
                        .long("cluster")
                        .value_name("CLUSTER")
                        .help("Solana cluster")
                        .default_value("devnet")
                        .possible_values(["mainnet", "devnet", "testnet", "localnet"]),
                )
                .arg(
                    Arg::new("keypair")
                        .long("keypair")
                        .value_name("KEYPAIR_PATH")
                        .help("Path to keypair file")
                        .default_value("~/.config/solana/id.json"),
                ),
        )
        .get_matches();

    match matches.subcommand() {
        Some(("create-fungible", sub_matches)) => {
            let args = TokenCreationArgs {
                name: sub_matches.get_one::<String>("name").unwrap().clone(),
                symbol: sub_matches.get_one::<String>("symbol").unwrap().clone(),
                uri: sub_matches.get_one::<String>("uri").unwrap().clone(),
                decimals: sub_matches
                    .get_one::<String>("decimals")
                    .unwrap()
                    .parse()
                    .unwrap(),
                initial_supply: sub_matches
                    .get_one::<String>("supply")
                    .unwrap()
                    .parse()
                    .unwrap(),
                cluster: match sub_matches.get_one::<String>("cluster").unwrap().as_str() {
                    "mainnet" => Cluster::Mainnet,
                    "devnet" => Cluster::Devnet,
                    "testnet" => Cluster::Testnet,
                    "localnet" => Cluster::Localnet,
                    _ => Cluster::Devnet,
                },
                keypair_path: sub_matches.get_one::<String>("keypair").unwrap().clone(),
            };
            create_fungible_token(args)?;
        }
        Some(("create-acts", sub_matches)) => {
            let args = TokenCreationArgs {
                name: "Anectos Community Token".to_string(),
                symbol: "ACTS".to_string(),
                uri: "https://anectos.com/metadata/acts-token.json".to_string(),
                decimals: 9,
                initial_supply: 1_000_000_000, // 1 billion tokens
                cluster: match sub_matches.get_one::<String>("cluster").unwrap().as_str() {
                    "mainnet" => Cluster::Mainnet,
                    "devnet" => Cluster::Devnet,
                    "testnet" => Cluster::Testnet,
                    "localnet" => Cluster::Localnet,
                    _ => Cluster::Devnet,
                },
                keypair_path: sub_matches.get_one::<String>("keypair").unwrap().clone(),
            };
            println!("🚀 Creating ACTS governance token with predefined settings...");
            create_fungible_token(args)?;
        }
        _ => {
            println!("No subcommand provided. Use --help for usage information.");
        }
    }

    Ok(())
}

fn create_fungible_token(args: TokenCreationArgs) -> Result<()> {
    println!("🏗️  Creating fungible token with the following parameters:");
    println!("   Name: {}", args.name);
    println!("   Symbol: {}", args.symbol);
    println!("   URI: {}", args.uri);
    println!("   Decimals: {}", args.decimals);
    println!("   Initial Supply: {}", args.initial_supply);
    println!("   Cluster: {:?}", args.cluster);

    // Load keypair
    let keypair_path = shellexpand::tilde(&args.keypair_path);
    let payer = Keypair::read_from_file(&*keypair_path)
        .map_err(|e| anyhow::anyhow!("Failed to read keypair: {}", e))?;

    println!("💼 Payer: {}", payer.pubkey());

    // Create client
    let client = Client::new_with_options(args.cluster, &payer, CommitmentConfig::confirmed());
    let program_id = Pubkey::from_str(ANECTOS_PROGRAM_ID)?;
    let program = client.program(program_id)?;

    // Generate mint keypair
    let mint_keypair = Keypair::new();
    let mint = mint_keypair.pubkey();

    println!("🏦 Mint address: {}", mint);

    // Derive metadata PDA
    let metadata_seeds = &[
        "metadata".as_bytes(),
        TOKEN_METADATA_PROGRAM_ID.as_ref(),
        mint.as_ref(),
    ];
    let (metadata, _) = Pubkey::find_program_address(metadata_seeds, &TOKEN_METADATA_PROGRAM_ID);

    // Get associated token account
    let token_account = get_associated_token_address(&payer.pubkey(), &mint);

    println!("📄 Metadata address: {}", metadata);
    println!("🪙 Token account: {}", token_account);

    // Convert initial supply to smallest unit
    let initial_supply_with_decimals = args.initial_supply * 10_u64.pow(args.decimals as u32);

    // Build and send transaction
    let signature = program
        .request()
        .accounts(anectos_project::accounts::CreateFungibleToken {
            metadata,
            mint,
            token_account,
            payer: payer.pubkey(),
            rent: rent::ID,
            system_program: system_program::ID,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: spl_associated_token_account::ID,
            token_metadata_program: TOKEN_METADATA_PROGRAM_ID,
        })
        .args(anectos_project::instruction::CreateFungibleToken {
            name: args.name.clone(),
            symbol: args.symbol.clone(),
            uri: args.uri.clone(),
            decimals: args.decimals,
            initial_supply: initial_supply_with_decimals,
        })
        .signer(&mint_keypair)
        .send()?;

    println!("✅ Transaction sent successfully!");
    println!("📝 Transaction signature: {}", signature);
    println!("🔗 View on Solana Explorer:");
    
    let explorer_url = match args.cluster {
        Cluster::Mainnet => format!("https://explorer.solana.com/tx/{}", signature),
        Cluster::Devnet => format!("https://explorer.solana.com/tx/{}?cluster=devnet", signature),
        Cluster::Testnet => format!("https://explorer.solana.com/tx/{}?cluster=testnet", signature),
        Cluster::Localnet => format!("http://localhost:3000/tx/{}", signature),
    };
    
    println!("   {}", explorer_url);

    // Save token info to file
    let token_info = serde_json::json!({
        "name": args.name,
        "symbol": args.symbol,
        "mint": mint.to_string(),
        "token_account": token_account.to_string(),
        "metadata": metadata.to_string(),
        "decimals": args.decimals,
        "initial_supply": args.initial_supply,
        "transaction": signature.to_string(),
        "cluster": format!("{:?}", args.cluster),
        "created_at": chrono::Utc::now().to_rfc3339()
    });

    let filename = format!("{}-token-{}.json", args.symbol.to_lowercase(), 
                          chrono::Utc::now().format("%Y%m%d-%H%M%S"));
    std::fs::write(&filename, serde_json::to_string_pretty(&token_info)?)?;
    
    println!("💾 Token information saved to: {}", filename);

    // Display environment variable
    println!("\n📋 Add this to your environment variables:");
    if args.symbol == "ACTS" {
        println!("NEXT_PUBLIC_ACTS_TOKEN_MINT={}", mint);
    } else {
        println!("NEXT_PUBLIC_{}_TOKEN_MINT={}", args.symbol.to_uppercase(), mint);
    }

    Ok(())
}

// Helper function to estimate transaction cost
fn _estimate_transaction_cost() -> u64 {
    // Rough estimate for token creation transaction
    // Actual cost may vary based on network conditions
    5000 + // Base transaction fee
    2039280 + // Rent for mint account
    2039280 + // Rent for metadata account
    1000000   // Buffer for associated token account and other costs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_creation_args() {
        let args = TokenCreationArgs {
            name: "Test Token".to_string(),
            symbol: "TEST".to_string(),
            uri: "https://example.com/metadata.json".to_string(),
            decimals: 9,
            initial_supply: 1000000,
            cluster: Cluster::Devnet,
            keypair_path: "~/.config/solana/id.json".to_string(),
        };

        assert_eq!(args.name, "Test Token");
        assert_eq!(args.symbol, "TEST");
        assert_eq!(args.decimals, 9);
        assert_eq!(args.initial_supply, 1000000);
    }
}
