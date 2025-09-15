import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMintToInstruction,
} from "@solana/spl-token";

// Create connection to local validator
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const recentBlockhash = await connection.getLatestBlockhash();

// Generate a new keypair for the fee payer
const feePayer = Keypair.generate();

// Airdrop 1 SOL to fee payer
const airdropSignature = await connection.requestAirdrop(
  feePayer.publicKey,
  LAMPORTS_PER_SOL
);
await connection.confirmTransaction({
  blockhash: recentBlockhash.blockhash,
  lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
  signature: airdropSignature,
});

// Generate keypair to use as address of mint
const mint = Keypair.generate();

// Get minimum balance for rent exemption
const mintRent = await getMinimumBalanceForRentExemptMint(connection);

// Get the associated token account address
const associatedTokenAccount = getAssociatedTokenAddressSync(
  mint.publicKey,
  feePayer.publicKey,
  false, // allowOwnerOffCurve
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
);

// Create account instruction
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: feePayer.publicKey,
  newAccountPubkey: mint.publicKey,
  space: MINT_SIZE,
  lamports: mintRent,
  programId: TOKEN_2022_PROGRAM_ID,
});

// Initialize mint instruction
const initializeMintInstruction = createInitializeMintInstruction(
  mint.publicKey, // mint pubkey
  2, // decimals
  feePayer.publicKey, // mint authority
  feePayer.publicKey, // freeze authority
  TOKEN_2022_PROGRAM_ID
);

// Create associated token account instruction
const createAssociatedTokenAccountIx = createAssociatedTokenAccountInstruction(
  feePayer.publicKey, // payer
  associatedTokenAccount, // associated token account address
  feePayer.publicKey, // owner
  mint.publicKey, // mint
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
);

// Create and sign transaction with both mint creation and ATA creation
const transaction = new Transaction({
  feePayer: feePayer.publicKey,
  blockhash: recentBlockhash.blockhash,
  lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
}).add(
  createAccountInstruction,
  initializeMintInstruction,
  createAssociatedTokenAccountIx
);

// Sign transaction
const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [feePayer, mint]
);

console.log("Mint Address:", mint.publicKey.toBase58());
console.log(
  "Associated Token Account Address:",
  associatedTokenAccount.toBase58()
);
console.log("Transaction Signature:", transactionSignature);

// Create a separate transaction for minting tokens
// Create mint to instruction (mint 100 tokens = 1.00 with 2 decimals)
const mintAmount = 100;
const mintToInstruction = createMintToInstruction(
  mint.publicKey, // mint
  associatedTokenAccount, // destination
  feePayer.publicKey, // authority
  mintAmount, // amount
  [], // multiSigners
  TOKEN_2022_PROGRAM_ID // programId
);

// Get a new blockhash for the mint transaction
const mintBlockhash = await connection.getLatestBlockhash();

// Create and sign transaction for minting tokens
const mintTransaction = new Transaction({
  feePayer: feePayer.publicKey,
  blockhash: mintBlockhash.blockhash,
  lastValidBlockHeight: mintBlockhash.lastValidBlockHeight,
}).add(mintToInstruction);

// Sign and send mint transaction
const mintTransactionSignature = await sendAndConfirmTransaction(
  connection,
  mintTransaction,
  [feePayer]
);

console.log("Transaction Signature:", mintTransactionSignature);
