import styles from '../styles/shop.module.css';

// ticket card component
const TicketCard = ({ ticket }) => {
  return (
    <div className={styles.ticketCard}>
      <h2>{ticket.eventName}</h2>
      <p>Id: {ticket.id}</p>
      <p>Place: {ticket.place}</p>
      <p>Date: {ticket.date}</p>
      <p>Price: {ticket.price} Ether</p>
    </div>
  );
};

const Page = ({ connected, ticketsForSale }) => {
  return (
    <>
      {connected ? (
      <>
        {/* WALLET CONNECTED */}
        <div className={styles.ticketGridContainer}>
          <div className={styles.ticketGrid}>
            {ticketsForSale.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
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
  );
};

export default Page;