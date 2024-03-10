use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{OutputReference, ScriptContext, Spend, Transaction, TransactionId}
use aiken/transaction/credential.{VerificationKey}
 
type Datum {
  owner: Hash<Blake2b_224, VerificationKey>,
}
 
validator {
  fn must_be_signed(datum: Datum, context: ScriptContext) -> Bool { 
    list.has(context.transaction.extra_signatories, datum.owner)
  }
}

test must_be_signed_example() {
  let datum =
    Datum { owner: #"00000000000000000000000000000000000000000000000000000000" }
 
  let placeholder_utxo =
    OutputReference { transaction_id: TransactionId(""), output_index: 0 }
 
  let context =
    ScriptContext {
      purpose: Spend(placeholder_utxo),
      transaction: transaction.placeholder()
        |> fn(transaction) {
             Transaction { ..transaction, extra_signatories: [datum.owner] }
           }
    }
 
  must_be_signed(datum, context)
}