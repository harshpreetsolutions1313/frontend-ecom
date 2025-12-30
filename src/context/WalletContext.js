import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import ecommercePaymentAbi from '../abi/ecommercePaymentAbi.json';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [wcProvider, setWcProvider] = useState(null);

  const BSC_TESTNET_CONFIG = {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  };

  const switchToBSCTestnet = async (ethereum) => {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_TESTNET_CONFIG],
        });
      } else {
        throw err;
      }
    }
  };

  const setupContract = async (prov, sig) => {
    const cont = new ethers.Contract(
      process.env.REACT_APP_CONTRACT_ADDRESS,
      ecommercePaymentAbi,
      sig
    );
    console.log("Contract initialized:", cont);

    const add = await sig.getAddress();
    setAddress(add);
    setProvider(prov);
    setSigner(sig);
    setContract(cont);

    return { address: add, provider: prov, signer: sig, contract: cont };
  };

  const connectMetaMask = async () => {
    console.log("Connecting to MetaMask...");
    if (!window.ethereum) {
      throw new Error('Please install MetaMask');
    }

    try {
      await switchToBSCTestnet(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const prov = new ethers.BrowserProvider(window.ethereum);
      const sig = await prov.getSigner();

      await setupContract(prov, sig);
      setWalletType('metamask');

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return true;
    } catch (err) {
      console.error("MetaMask Connection Error:", err);
      throw err;
    }
  };

  const connectWalletConnect = async (isNewConnection = true) => {
    console.log(`[WC] Starting connect (new=${isNewConnection}, showQr=${isNewConnection})`);

    try {
      if (!process.env.REACT_APP_WALLETCONNECT_PROJECT_ID) {
        throw new Error('Missing REACT_APP_WALLETCONNECT_PROJECT_ID in .env');
      }

      const walletConnectProvider = await EthereumProvider.init({
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
        chains: [97],
        showQrModal: isNewConnection,
        qrModalOptions: { themeMode: 'light' },
        metadata: {
          name: 'Ecommerce DApp',
          description: 'Decentralized Ecommerce Platform',
          url: window.location.origin,
          icons: [`${window.location.origin}/assets/images/logo/logo.png`]
        },
        rpcMap: {
          97: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
        }
      });

      if (!walletConnectProvider) {
        throw new Error('Provider init returned null/undefined');
      }

      if (isNewConnection) {
        console.log("[WC] New connection: calling enable() and waiting for session...");

        // Call enable and wait for the promise to resolve
        await walletConnectProvider.enable();
        
        console.log("[WC] Enable completed, checking session...");
        console.log("[WC] Session:", walletConnectProvider.session);
        console.log("[WC] Accounts:", walletConnectProvider.accounts);

        // Give a moment for accounts to populate after enable
        await new Promise(r => setTimeout(r, 500));

        // Try to get accounts from the session directly if not in accounts array
        if (!walletConnectProvider.accounts?.length) {
          console.log("[WC] No accounts in provider.accounts, checking session...");
          
          if (walletConnectProvider.session?.namespaces?.eip155?.accounts) {
            const sessionAccounts = walletConnectProvider.session.namespaces.eip155.accounts;
            console.log("[WC] Found accounts in session:", sessionAccounts);
            
            // Extract addresses from CAIP-10 format (chain:chainId:address)
            const addresses = sessionAccounts.map(acc => acc.split(':')[2]);
            
            if (addresses.length > 0) {
              // Manually populate accounts
              walletConnectProvider.accounts = addresses;
              console.log("[WC] Populated accounts from session:", addresses);
            }
          }
        }

        // Wait a bit more if still no accounts
        let attempts = 0;
        while (!walletConnectProvider.accounts?.length && attempts < 10) {
          await new Promise(r => setTimeout(r, 300));
          attempts++;
          console.log(`[WC] Waiting for accounts... attempt ${attempts}`);
        }

      } else {
        // Restore mode – give library time to load existing session
        console.log("[WC] Restore mode: waiting for session to load...");
        
        let attempts = 0;
        while (!walletConnectProvider.session && attempts < 10) {
          await new Promise(r => setTimeout(r, 250));
          attempts++;
        }

        if (walletConnectProvider.session) {
          // Try to extract accounts from session
          if (walletConnectProvider.session.namespaces?.eip155?.accounts) {
            const sessionAccounts = walletConnectProvider.session.namespaces.eip155.accounts;
            const addresses = sessionAccounts.map(acc => acc.split(':')[2]);
            
            if (addresses.length > 0 && !walletConnectProvider.accounts?.length) {
              walletConnectProvider.accounts = addresses;
              console.log("[WC] Restored accounts from session:", addresses);
            }
          }
        }

        if (!walletConnectProvider.accounts?.length) {
          throw new Error("No active WalletConnect session found after restore attempt");
        }
      }

      // Final check – should now have accounts
      if (!walletConnectProvider.accounts?.length) {
        console.error("[WC] No accounts available. Provider state:", {
          accounts: walletConnectProvider.accounts,
          session: walletConnectProvider.session,
          connected: walletConnectProvider.connected
        });
        throw new Error("No accounts available after connection/restore");
      }

      console.log("[WC] Success – accounts:", walletConnectProvider.accounts);

      const prov = new ethers.BrowserProvider(walletConnectProvider);
      const sig = await prov.getSigner();

      await setupContract(prov, sig);
      setWalletType('walletconnect');
      setWcProvider(walletConnectProvider);

      // Attach listeners
      walletConnectProvider.on('accountsChanged', handleAccountsChanged);
      walletConnectProvider.on('chainChanged', (chainId) => {
        console.log('[WC] Chain changed to:', chainId);
      });
      walletConnectProvider.on('disconnect', handleDisconnect);

      return true;
    } catch (err) {
      console.error("[WC] Connection failed:", err.message || err);
      throw err;
    }
  };

  const connectWallet = async (type = 'metamask') => {
    try {
      if (type === 'walletconnect') {
        return await connectWalletConnect(true); // new connection → show QR
      } else {
        return await connectMetaMask();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      if (walletType === 'walletconnect' && wcProvider) {
        await wcProvider.disconnect();
      }

      // Clean WalletConnect localStorage keys to prevent stale sessions
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wc@') || key.includes('walletconnect') || key.includes('WALLET_CONNECT')) {
          localStorage.removeItem(key);
        }
      });

      // Clear state
      setProvider(null);
      setSigner(null);
      setContract(null);
      setAddress(null);
      setWalletType(null);
      setWcProvider(null);

      // Remove listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      if (wcProvider) {
        wcProvider.removeListener('accountsChanged', handleAccountsChanged);
        wcProvider.removeListener('disconnect', handleDisconnect);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      window.location.reload();
    }
  };

  const handleDisconnect = () => {
    console.log("Wallet disconnected event received");
    disconnectWallet();
  };

  // Auto-connect / auto-restore on mount
  useEffect(() => {
    const autoConnect = async () => {
      // 1. MetaMask auto-connect
      if (window.ethereum?.selectedAddress) {
        try {
          console.log("Auto-connecting MetaMask...");
          await connectMetaMask();
        } catch (err) {
          console.warn("MetaMask auto-connect failed", err);
        }
      }

      // 2. WalletConnect auto-restore (silent – no QR)
      try {
        const hasWcSession = Object.keys(localStorage).some(key =>
          key.startsWith('wc@') || key.includes('walletconnect') || key.includes('WALLET_CONNECT')
        );

        if (hasWcSession) {
          console.log("Found existing WalletConnect session → attempting restore...");
          await connectWalletConnect(false); // false = do NOT show QR
        }
      } catch (err) {
        console.warn("WalletConnect auto-restore failed", err);
      }
    };

    autoConnect();

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      if (wcProvider) {
        wcProvider.removeListener('accountsChanged', handleAccountsChanged);
        wcProvider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []); // empty dependency array = run once on mount

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        contract,
        connectWallet,
        disconnectWallet,
        address,
        walletType,
        isConnected: !!address,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
