import React from 'react';
import { MonthCost, MonthType, YearCost } from '../constants'; // Import your pricing constants

const SubscriptionDetailsFlutterwave = ({ jsonData, plan, method }) => {
    let amount = '';
    if (plan === MonthType) {
        amount = MonthCost;
    } else {
        amount = YearCost;
    }

    const DateString = jsonData.created_at;
    const Daate = new Date(DateString);
    
    const day = Daate.getDate().toString().padStart(2, '0');
    const month = (Daate.getMonth() + 1).toString().padStart(2, '0');
    const year = Daate.getFullYear();
    
    const formattedDate = `${day}-${month}-${year}`;

    return (
        <div className='text-center py-10 flex items-center justify-center max-w-lg flex-col'>
            <p className='text-black dark:text-white font-normal'><strong>Payment Method:</strong> {method.toUpperCase()}</p>
            <p className='text-black dark:text-white font-normal'><strong>Plan:</strong> {plan} <span className='font-bold text-green-500'> {jsonData.status}</span></p>
            <p className='text-black dark:text-white font-normal'><strong>Created At:</strong> {formattedDate}</p>
            <p className='text-black dark:text-white font-normal'><strong>Transaction ID:</strong> {jsonData.id}</p>
            <p className='text-black dark:text-white font-normal'><strong>Customer ID:</strong> {jsonData.customer.id}</p>
            <p className='text-black dark:text-white font-normal'><strong>Amount:</strong> {amount} USD</p>
        </div>
    );
};

export default SubscriptionDetailsFlutterwave;