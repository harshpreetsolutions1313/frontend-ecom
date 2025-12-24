import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ecommercePaymentAbi from '../abi/ecommercePaymentAbi.json';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState();

  const switchToBSCTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x61',
            chainName: 'BSC Testnet',
            nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
            blockExplorerUrls: ['https://testnet.bscscan.com'],
          }],
        });
      } else {
        throw err;
      }
    }
  };

  const connectWallet = async () => {

    console.log("inside connect wallet");
    if (window.ethereum) {
      try {
        await switchToBSCTestnet();
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const prov = new ethers.BrowserProvider(window.ethereum);
        const sig = await prov.getSigner();
        
        const cont = new ethers.Contract(
          process.env.REACT_APP_CONTRACT_ADDRESS,
           ecommercePaymentAbi,
          sig
        );

        console.log("here is the contract", cont);
        const add = await sig.getAddress();

        setAddress(add);
        setProvider(prov);
        setSigner(sig);
        setContract(cont);
      } catch (err) {
        console.error("Connection Error:", err);
        throw err;
      }
    } else {
      throw new Error('Please install MetaMask');
    }
  };

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []);

  return (
    <WalletContext.Provider value={{ provider, signer, contract, connectWallet, address }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
