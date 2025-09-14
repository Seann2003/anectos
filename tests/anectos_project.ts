import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Anectos } from "../target/types/anectos";

describe("anectos", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anectosProject as Program<Anectos>;
});
