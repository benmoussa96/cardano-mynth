import {
  Blockfrost,
  C,
  Constr,
  Data,
  Lucid,
  Script,
  SpendingValidator,
  TxHash,
  fromHex,
  toHex,
} from "lucid-cardano";
import * as fs from "fs";
import "dotenv/config";
import "mocha";
import { expect } from "chai";

import { lock } from "../src/lock";

describe("testing locking functionality", async () => {
  let lucid: Lucid, validator: Script, privateKey: string, address: string;

  beforeEach(async () => {
    lucid = await Lucid.new(
      new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        process.env.BLOCKFROST_PROJECT_ID
      ),
      "Preview"
    );

    privateKey = fs.readFileSync("me.sk", "utf8");
    address = await lucid.selectWalletFromPrivateKey(privateKey).wallet.address();

    lucid.selectWalletFromPrivateKey(privateKey);

    const plutus = JSON.parse(fs.readFileSync("plutus.json", "utf8")).validators[0];
    validator = {
      type: "PlutusV2",
      script: plutus.compiledCode,
    };
  });

  it("locks funds into smart contract", async () => {
    const publicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address())
      .paymentCredential?.hash;

    const datum = Data.to(new Constr(0, [publicKeyHash]));

    const txHash = await lock(10000000n, { into: validator, owner: datum });
    await lucid.awaitTx(txHash);

    console.log(txHash);
  });
});
