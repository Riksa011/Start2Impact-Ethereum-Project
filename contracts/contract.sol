// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract NFTickeT is ERC721, Ownable {

    uint256 private ticketCounter;

    struct TicketDetails {
        string eventName;
        string place;
        string date;
        uint256 etherCentsPrice;
        bool availability;
    }

    mapping(uint256 => TicketDetails) private ticketDetails;

    uint256[] private ticketsForSale;

    event TicketCreated(uint256 indexed tokenId, string eventName, string place, string date, uint256 etherCentsPrice);

    event TicketPurchased(uint256 indexed tokenId, address buyer, uint256 etherCentsPrice);

    event TicketUsed(uint256 indexed tokenId, address user);


    constructor() ERC721("NFTickeT", "NFTT") {}


    // Allows the contract owner to create multiple ticket NFTs with specified details and prices
    function createTickets(string memory eventName, string memory place, string memory date, uint256 etherCentsPrice, uint256 numberOfTickets) public onlyOwner {
        require(numberOfTickets > 0, "Ticket number must be greater than zero");
        require(etherCentsPrice > 0, "Ticket price in ether cents must be greater than zero");

        for (uint256 i = 0; i < numberOfTickets; i++) {
            ticketCounter++;

            TicketDetails memory newTicket = TicketDetails(eventName, place, date, etherCentsPrice, true);
            ticketDetails[ticketCounter] = newTicket;

            _mint(address(this), ticketCounter);

            emit TicketCreated(ticketCounter, eventName, place, date, etherCentsPrice);

            ticketsForSale.push(ticketCounter);
        }
    }


    // Retrieves the details of a specific ticket NFT based on its token ID
    function getTicketDetails(uint256 tokenId) public view returns (string memory, string memory, string memory, uint256, bool) {
        require(_exists(tokenId), "Ticket does not exist");
        TicketDetails memory ticket = ticketDetails[tokenId];
        return (ticket.eventName, ticket.place, ticket.date, ticket.etherCentsPrice, ticket.availability);
    }


    // Returns the list of ticket IDs currently for sale
    function getTicketsForSale() external view returns (uint256[] memory) {
        return ticketsForSale;
    }


    // Allows the owner or approved user to mark a ticket NFT as used
    function useTicket(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "You must own the ticket or be approved by the owner");
        require(ticketDetails[tokenId].availability, "Ticket has already been used");

        ticketDetails[tokenId].availability = false;

        emit TicketUsed(tokenId, msg.sender);
    }


    // Allows a user to purchase a ticket NFT that is listed for sale
    function buyTicket(uint256 tokenId) external payable {
        require(_exists(tokenId), "Ticket does not exist");
        require(ownerOf(tokenId) == address(this), "Ticket is not available for purchase");
        require(ticketDetails[tokenId].availability, "Ticket has already been used and cannot be sold");
        
        uint256 price = ticketDetails[tokenId].etherCentsPrice * 1 ether / 100;

        require(msg.value >= price, "Insufficient ether sent");

        _transfer(address(this), msg.sender, tokenId);

        emit TicketPurchased(tokenId, msg.sender, price);

        // Gives back to user excess ether sent
        uint256 excessAmount = msg.value - price;

        if (excessAmount > 0) {
            payable(msg.sender).transfer(excessAmount);
        }

        // Updates array ticketsForSale
        for (uint256 i = 0; i < ticketsForSale.length; i++) {
            if (ticketsForSale[i] == tokenId) {
                if (i != ticketsForSale.length - 1) {
                    ticketsForSale[i] = ticketsForSale[ticketsForSale.length - 1];
                }
                ticketsForSale.pop();
                break;
            }
        }
    }


    // Allows the contract owner to send Ether to the contract
    function addFunds() external payable onlyOwner {}


    // Allows the contract owner to withdraw Ether from the contract
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");

        uint256 contractBalance = address(this).balance;
        require(contractBalance >= amount, "Contract has not enough funds to withdraw");

        payable(msg.sender).transfer(amount);
    }  
}