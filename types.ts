
export interface TokenData {
  name: string;
  symbol: string;
  description: string;
  image: string; // This will now be the IPFS URL
  treasuryAddress: string;
}

export interface CreatedTokenInfo extends TokenData {
  address: string;
  ownerAddress: string;
  transactionSignature: string;
}