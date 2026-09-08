/**
 * On-Chain Score Service (20% of total)
 * 
 * IMPORTANT MVP LIMITATION: No real verified blockchain data (transactions, wallets, balances) 
 * exists in the current backend. To prevent gaming and avoid fake data, this MVP
 * interface currently returns 0 until a real blockchain provider integration is added.
 * 
 * => Because On-Chain is weighted at 20% and returns 0, the MAXIMUM currently 
 * achievable Trust Score across the platform will be 80 until real data is integrated.
 */

const calculateOnChainScore = async (userId) => {
  // TODO: Integrate actual blockchain data retrieval here
  return 0; // Normalized score 0-100
};

module.exports = {
  calculateOnChainScore,
};
