import { Lucid } from "lucid-cardano";
import * as fs from "fs";

const lucid = await Lucid.new(undefined, "Preview");

const privateKey = lucid.utils.generatePrivateKey();
const address = await lucid.selectWalletFromPrivateKey(privateKey).wallet.address();

try {
  fs.writeFileSync("me.sk", privateKey);
  fs.writeFileSync("me.addr", address);
} catch (err) {
  console.error(err);
}
