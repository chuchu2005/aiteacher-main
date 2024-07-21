import React from 'react';

const ReceiptDisplayFlutterwave = ({ jsonData }) => {

    if (!jsonData) {
        return (
            <div className='text-center py-10 flex items-center justify-center max-w-lg flex-col'>
                <h2 className='text-black dark:text-white font-black text-2xl my-3'>Loading Receipt Information...</h2>
            </div>
        );
    }


    return (
        <div className='text-center py-10 flex items-center justify-center max-w-lg flex-col'>
            <h2 className='text-black dark:text-white font-black text-2xl my-3'>Receipt Information</h2>
            <p className='text-black dark:text-white font-normal'><strong>Transaction ID:</strong> {jsonData.tx_ref}</p>
            <p className='text-black dark:text-white font-normal'><strong>Customer ID:</strong> {jsonData.id}</p>
            <p className='text-black dark:text-white font-normal'><strong>Payment Status:</strong> {jsonData.status}</p>
            <p className='text-black dark:text-white font-normal'><strong>Amount:</strong> {jsonData.amount} GBP</p>
        </div>
    );
};

export default ReceiptDisplayFlutterwave;