import Head from "next/head"
import "../styles/globals.css"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { Web3Provider } from '@ethersproject/providers';
const { ethers } = require("ethers"); 
const {contractAddress, contractAbi} = require('../contractData.js')


export default function AppWrapper({ Component, pageProps }) {

  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userBalance, setUserBalance] = useState('');
  const [userNftBalance, setUserNftBalance] = useState('');
  const [ticketsForSale, setTicketsForSale] = useState([]);


  // Function to handle metamask wallet connection
  const connectWalletHandler = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        if (!connected) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new Web3Provider(window.ethereum);
          const contractInstance = new ethers.Contract(contractAddress, contractAbi, provider.getSigner());
          setAddress(accounts[0]);
          console.log('MetaMask connected successfully');
          setConnected(true);
          setProvider(provider);
          setContract(contractInstance);
          setSigner(provider.getSigner());
        } else {
          setAddress('');
          console.log('Wallet disconnected');
          setConnected(false);
          setProvider(null);
          setContract(null);
        }
      } catch (err) {
        console.error(err.message)
      }
    } else {
      console.error('Please install MetaMask browser extension')
    }
  };

  
  // Function to get user ether and nftt balances
  const getUserBalances = async () => {
    try {
      if (provider) {
        // get user ether balance
        const balanceWei = await signer.getBalance();
        const balanceEth = balanceWei / 10 ** 18;
        const formattedBalance = parseFloat(balanceEth).toFixed(6);
        setUserBalance(formattedBalance);

        // get user nftt balance
        const nftBalanceUser = await contract.balanceOf(address);
        const nftBalanceUserForm = parseInt(nftBalanceUser.toString());
        setUserNftBalance(nftBalanceUserForm);
      }
    } catch (error) {
      console.error('Error fetching balance:', error.message);
    }
  };


  // Function to get tickets for sale with details
  const getTicketsData = async () => {
    try {
      // fetch array with tickets for sale IDs
      const localTicketsForSaleRaw = await contract.getTicketsForSale();
      const localTicketsForSaleFormatted = localTicketsForSaleRaw.map((bigIntValue) => Number(bigIntValue));
      const localTicketsForSale = localTicketsForSaleFormatted.sort((a, b) => a - b);

      // fetch tickets for sale details
      const ticketDetailsPromises = [];

      // Fetch ticket details for each ticket ID
      localTicketsForSale.forEach((ticketId) => {
        const ticketDetailsPromise = contract.getTicketDetails(ticketId).then((details) => {
          return {
            id: ticketId,
            eventName: details[0],
            place: details[1],
            date: details[2],
            price: (Number(details[3]) / 100),
            availability: details[4],
          };
        });

        ticketDetailsPromises.push(ticketDetailsPromise);
      });

      // Wait for all fetch requests to be done
      const ticketDetailsData = await Promise.all(ticketDetailsPromises);

      // Combine ticket details with IDs and update ticketsForSale state variable
      const combinedTicketsData = localTicketsForSale.map((ticketId, index) => {
        return {
          id: ticketId,
          ...ticketDetailsData[index],
        };
      });
      setTicketsForSale(combinedTicketsData);    

    } catch (error) {
      console.error('Error fetching ticket data:', error.message);
    }
  };
  
  
  
  // Effect to connect to MetaMask and initialize contract
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      if (window.ethereum.selectedAddress) {
        const provider = new Web3Provider(window.ethereum);
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, provider.getSigner());
        setProvider(provider);
        setContract(contractInstance);
        setAddress(window.ethereum.selectedAddress);
        setConnected(true);
        setSigner(provider.getSigner());
      }
    }
  }, []);

  
  // Effect to get tickets data
  useEffect(() => {
    if (contract && !ticketsForSale.length) {
      getTicketsData();
    }
  }, [contract]);


  // Effect to get user balances when address or web3 changes
  useEffect(() => {
    getUserBalances();
  }, [address, provider]);


  // front end html template
  return (
    <>
      <Head>
        <title>NFTicket</title>
      </Head>

      <div className="page-wrapper">
        {/* navbar */}
        <nav className="nav">
          <div className="navbar-content">

            {/* logo image */}
            <div className="logo">
              <Link href="/">
                <img src="/icons/logo2.png" alt="NFTicket Logo" />
              </Link>
            </div>

            {/* pages links */}
            <ul className="nav-links">
              {connected ? (
                <>
                  {/* WALLET CONNECTED */}
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/shop">Shop</Link>
                  </li>
                  <li>
                    <Link href="/ticket-center">Ticket Center</Link>
                  </li>
                </>
              ) : (
                <>
                  {/* WALLET NOT CONNECTED */}
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  <li>
                    <Link href="https://www.linkedin.com/in/riccardo-santi/" target="_blank">My Linkedin</Link>
                  </li>
                  <li>
                    <Link href="https://github.com/Riksa011" target="_blank">My Github</Link>
                  </li>
                </>
              )}
            </ul>

            {/* connect wallet button */}
            <div className="connect-wallet">
              <button onClick={connectWalletHandler} className="connectWalletButton">
                {connected ? "Disconnect Wallet" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </nav>

        {/* page content */}
        <div className="content">
          <Component {...pageProps}
            address={address}
            contract={contract}
            ticketsForSale={ticketsForSale}
            userBalance={userBalance}
            userNftBalance={userNftBalance}
            connected={connected}
          />
        </div>

        {/* footer */}
        <footer className="footer">

          <p>
            <strong>Riccardo Santi</strong> ©2023 Start2Impact Ethereum Project
          </p>
        
        </footer>
      </div>
    </>
  )
}