import BN from "bn.js";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { CONNECTION, SPL_GOVERNANCE } from "./constants";

export const publicKeyFromBn = (feePayer: any) => {
  const bigNumber = new BN(feePayer._bn, 16);
  const decoded = { _bn: bigNumber };
  return new PublicKey(decoded);
};

export const toSdgEnum = (n: number) => {
  switch (n) {
    case 1:
      return { noPoverty: {} };
    case 2:
      return { zeroHunger: {} };
    case 3:
      return { goodHealthAndWellBeing: {} };
    case 4:
      return { qualityEducation: {} };
    case 5:
      return { genderEquality: {} };
    case 6:
      return { cleanWaterAndSanitation: {} };
    case 7:
      return { affordableAndCleanEnergy: {} };
    case 8:
      return { decentWorkAndEconomicGrowth: {} };
    case 9:
      return { industryInnovationAndInfrastructure: {} };
    case 10:
      return { reducedInequalities: {} };
    case 11:
      return { sustainableCitiesAndCommunities: {} };
    case 12:
      return { responsibleConsumptionAndProduction: {} };
    case 13:
      return { climateAction: {} };
    case 14:
      return { lifeBelowWater: {} };
    case 15:
      return { lifeOnLand: {} };
    case 16:
      return { peaceJusticeAndStrongInstitutions: {} };
    case 17:
      return { partnershipsForTheGoals: {} };
    default:
      return null;
  }
};

export async function getDraftProposalPubkey(tokenOwnerRecord: PublicKey) {
  return (
    await SPL_GOVERNANCE.getProposalsByTokenOwnerRecord(tokenOwnerRecord)
  ).filter((proposal) => proposal.state.draft !== undefined)[0].publicKey;
}
