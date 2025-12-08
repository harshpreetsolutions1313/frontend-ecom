// Export the contract ABI and helper ABIs for ERC20
export const CONTRACT_ABI = [
  "function createAndPayForOrder(string _productId, uint256 _amount, address _token) external returns (uint256)",
  "function usdtToken() view returns (address)",
  "function usdcToken() view returns (address)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// Default token/contract addresses are read from env; override as needed
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
export const USDT_ADDRESS = process.env.REACT_APP_USDT_ADDRESS || "";
export const USDC_ADDRESS = process.env.REACT_APP_USDC_ADDRESS || "";

export default {
  CONTRACT_ABI,
  ERC20_ABI,
  CONTRACT_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
};
