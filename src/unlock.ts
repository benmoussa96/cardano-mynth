import {
  Blockfrost,
  Constr,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
  OutRef,
  Redeemer,
} from "lucid-cardano";
import * as fs from "fs";
import inquirer from "inquirer";
import "dotenv/config";

inquirer
  .prompt({
    type: "input",
    name: "txHash",
    message: "Enter the hash of the UTxO you want to unlock:",
  })
  .then(async (answers) => {
    const lucid = await Lucid.new(
      new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        process.env.BLOCKFROST_PROJECT_ID
      ),
      "Preview"
    );

    lucid.selectWalletFromPrivateKey(await fs.readFileSync("me.sk", "utf8"));

    const validator = await readValidator();

    // --- Supporting functions

    async function readValidator(): Promise<SpendingValidator> {
      const validator = JSON.parse(await fs.readFileSync("plutus.json", "utf8")).validators[0];
      return {
        type: "PlutusV2",
        script: validator.compiledCode,
      };
    }

    const utxo: OutRef = { txHash: answers.txHash, outputIndex: 0 };

    const redeemer = Data.empty();

    const txHash = await unlock(utxo, {
      from: validator,
      using: redeemer,
    });

    await lucid.awaitTx(txHash);

    console.log(`1 tADA unlocked from the contract
    Tx hash:    ${txHash}
    Redeemer: ${redeemer}
`);

    // --- Supporting functions

    async function unlock(
      ref: OutRef,
      { from, using }: { from: SpendingValidator; using: Redeemer }
    ): Promise<TxHash> {
      const [utxo] = await lucid.utxosByOutRef([ref]);
      const signer = await lucid.wallet.address();

      console.log("address:", signer);
      console.log("txHash:", ref.txHash);
      console.log("using:", using);

      const tx = await lucid
        .newTx()
        // .collectFrom([utxo])
        .collectFrom([utxo], using)
        .addSigner(signer)
        .attachSpendingValidator(from)
        .complete();

      const signedTx = await tx.sign().complete();

      return signedTx.submit();
    }
  })
  .catch((error) => {
    if (error.isTtyError) {
      console.log("Prompt couldn't be rendered in the current environment");
    } else {
      console.log("Something went wrong");
    }

    console.log(`ERROR: ${error}`);
  });
