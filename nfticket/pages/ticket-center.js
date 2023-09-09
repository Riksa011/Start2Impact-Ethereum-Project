import { useState } from 'react';
const BigNumber = require('bignumber.js');
const {contractAddress} = require('../contractData.js')


const Page = ({ contract, ticketsForSale, address, connected }) => {

    const [buyTicketId, setBuyTicketId] = useState('');
    const [useTicketId, setUseTicketId] = useState('');
    const [detailsTicketId, setDetailsTicketId] = useState('');
    const [ticketDetails, setTicketDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Function to remove error message after 10sec
    const removeError = () => {
      setTimeout(() => {
        setErrorMessage('');
      }, 12000);
    };

    // Function to remove success message after 10sec
    const removeSuccessMessage = () => {
      setTimeout(() => {
        setSuccessMessage('');
      }, 10000);
    };
  
    // Function to handle ticket id change in BUY form
    const handleBuyTicketIdChange = (event) => {
        setBuyTicketId(event.target.value);
    };

    // Function to handle ticket id change in USE form
    const handleUseTicketIdChange = (event) => {
        setUseTicketId(event.target.value);
    };

    // Function to handle ticket id change in SEARCH form
    const handleDetailsTicketIdChange = (event) => {
      setDetailsTicketId(event.target.value);
    };


    // Function to handle ticket use
    const handleUseTicket = async () => {
    
        try {
        // Check that the user input is a valid ticket ID
        const ticketIdInt = parseInt(useTicketId);
        if (!Number.isInteger(ticketIdInt) || ticketIdInt <= 0) {
          setErrorMessage('Enter a valid ticket ID');
          removeError();
            return;
        }

        // Check that user owns the ticket
        let owner = await contract.ownerOf(ticketIdInt);
        owner = owner.toLowerCase()
        if (owner !== address) {
          setErrorMessage('You must own the ticket to use it');
          removeError();
            return;
        }
    
        // Call useTicket function from contract
        await contract.useTicket(ticketIdInt);
        setSuccessMessage('Ticket used successfully, wait for transaction to be mined');
        removeSuccessMessage();

        } catch (error) {
          setErrorMessage('Error during ticket use');
          removeError();
        }
    };
  
    // Function to handle ticket purchase
    const handleBuyTicket = async () => {
      try {
        // Check that the user input is a valid ticket ID
        const ticketIdInt = parseInt(buyTicketId);
        if (!Number.isInteger(ticketIdInt) || ticketIdInt <= 0) {
          setErrorMessage('Enter a valid ticket ID');
          removeError();
          return;
        }
        
        // Check that ticket is in ticketsForSale array
        const selectedTicket = ticketsForSale.find((ticket) => ticket.id === ticketIdInt);
        if (!selectedTicket) {
          setErrorMessage('Ticket not listed for sale, see Shop page');
          removeError();
          return;
        }
    
        // Get ticket price and convert it to Wei
        const priceInEther = String(Number(selectedTicket.price));
        const priceInWei = new BigNumber(priceInEther).times(new BigNumber('1e18')).integerValue().toString();
  
        const transactionRequest = {
          value: priceInWei,
        };
  
        // Call buyTicket function from contract
        const tx = await contract.buyTicket(ticketIdInt, transactionRequest);
    
        setSuccessMessage('Ticket purchased successfully, wait for transaction to be mined');
        removeSuccessMessage();
  
      } catch (error) {
        setErrorMessage('Error during ticket purchase');
        removeError();
      }
    };

    // Function to fetch ticket details
    const handleViewTicketDetails = async () => {
      try {
        // Check that the user input is a valid ticket ID
        const ticketIdInt = parseInt(detailsTicketId);
        if (!Number.isInteger(ticketIdInt) || ticketIdInt <= 0) {
          setErrorMessage('Enter a valid ticket ID');
          removeError();
          return;
        }
  
        // Get token owner and contract address
        const tokenOwner = await contract.ownerOf(ticketIdInt);
        const userAddress = address.toLowerCase();
        const owner1 = tokenOwner.toLowerCase();
        const nfttAddress = contractAddress.toLowerCase();
        let owner;

        if (owner1 === nfttAddress) {
          owner = 'NFTT Contract';
        } else if (owner1 === userAddress) {
          owner = 'YOU :)';
        } else {
          owner = owner1;
        }
  
        // Get ticket details from contract
        const details = await contract.getTicketDetails(ticketIdInt);
  
        if (details) {
          // Build ticket details object
          const [eventName, place, date, price, availability] = details;
          setTicketDetails({
            id: ticketIdInt,
            owner: owner,
            eventName,
            place,
            date,
            price: Number(price) / 100,
            availability,
          });
  
        } else {
          setErrorMessage('Ticket not found');
          removeError();
          setTicketDetails(null);
        }
      } catch (error) {
        setErrorMessage('Ticket not found');
        removeError();
      }
    };

  return (
      <>
        {connected ? (
          <>
            {/* WALLET CONNECTED */}
            {/* TOP SECTION */}
            <div className='ticket-center-top-section'>
                {/* buy ticket form */}
                <div className='ticket-center-form'>
                    <h3>Buy a Ticket</h3>
                    <label htmlFor="buyTicketId"></label>
                    <input
                    type="text"
                    id="buyTicketId"
                    value={buyTicketId}
                    onChange={handleBuyTicketIdChange}
                    placeholder="Ticket ID"
                    />
                    <button onClick={handleBuyTicket}>Buy</button>
                </div>
                {/* use ticket form */}
                <div className='ticket-center-form'>
                    <h3>Use a Ticket</h3>
                    <label htmlFor="useTicketId"></label>
                    <input
                    type="text"
                    id="useTicketId"
                    value={useTicketId}
                    onChange={handleUseTicketIdChange}
                    placeholder="Ticket ID"
                    />
                    <button onClick={handleUseTicket}>Use</button>
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className='error-message'>
                {errorMessage}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {successMessage && (
              <div className='success-message'>
                {successMessage}
              </div>
            )}

            {/* BOTTOM SECTION */}
            <div className='ticket-center-bottom-section'>
                {/* search ticket form */}
                <div className='ticket-center-search'>
                    <h3>View Ticket Details</h3>
                    <label htmlFor="detailsTicketId"></label>
                    <input
                      type="text"
                      id="detailsTicketId"
                      value={detailsTicketId}
                      onChange={handleDetailsTicketIdChange}
                      placeholder="Ticket ID"
                    />
                    <button onClick={handleViewTicketDetails}>Search</button>

                    {ticketDetails && (
                      <div className='ticket-details'>
                        <h4>Details for Ticket ID {ticketDetails.id}</h4>
                        <p>Owner: {ticketDetails.owner}</p>
                        <p>Event Name: {ticketDetails.eventName}</p>
                        <p>Place: {ticketDetails.place}</p>
                        <p>Date: {ticketDetails.date}</p>
                        <p>Price: {ticketDetails.price} Ether</p>
                        <p>Availability: {ticketDetails.availability ? 'Available' : 'Not Available'}</p>
                      </div>
                    )}
                </div>
            </div>
          </>
        ) : (
          <>
            {/* WALLET NOT CONNECTED */}
            <h1 className='wallet-connected'>Connect your Metamask wallet to view this page</h1>
          </>
        )}
      </>
  )
}
  
export default Page;