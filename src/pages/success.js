import React, { useEffect, useState, useCallback } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { AiOutlineLoading } from 'react-icons/ai';
import { Button, Spinner } from 'flowbite-react';
import { MonthCost, MonthType, YearCost, company, logo, serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReceiptDisplayPayStack from '../components/receiptDisplayPayStack';

const Success = () => {
    const [processing, setProcessing] = useState(false);
    const [jsonData, setJsonData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const sendEmail = useCallback(async (jsonData) => {
        if (sessionStorage.getItem('method') === 'paystack') {
            const amount = sessionStorage.getItem('plan') === MonthType ? MonthCost : YearCost;
            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
                    <style>
                        .invoice-box { max-width: 800px; margin: auto; padding: 30px; font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; }
                        .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
                        .invoice-box table td { padding: 5px; vertical-align: top; }
                        .invoice-box table tr td:nth-child(2) { text-align: right; }
                        .invoice-box table tr.top table td { padding-bottom: 20px; }
                        .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
                        .invoice-box table tr.information table td { padding-bottom: 40px; }
                        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
                        .invoice-box table tr.details td { padding-bottom: 20px; }
                        .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
                        .invoice-box table tr.item.last td { border-bottom: none; }
                        .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td { width: 100%; display: block; text-align: center; }
                            .invoice-box table tr.information table td { width: 100%; display: block; text-align: center; }
                        }
                        .invoice-box.rtl { direction: rtl; font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; }
                        .invoice-box.rtl table { text-align: right; }
                        .invoice-box.rtl table tr td:nth-child(2) { text-align: left; }
                    </style>
                </head>
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img src=${logo} style="width: 100%; max-width: 50px" />
                                            </td>
                                            <td>
                                                Subscription Id: ${jsonData.subscription_code}<br />
                                                Customer ID: ${jsonData.customer_code}<br />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                                <strong>${company}</strong>
                                                <br />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="heading">
                                <td>Payment Method</td>
                                <td></td>
                            </tr>
                            <tr class="details">
                                <td>${sessionStorage.getItem('method')}</td>
                                <td></td>
                            </tr>
                            <tr class="heading">
                                <td>Item</td>
                                <td>Price</td>
                            </tr>
                            <tr class="item">
                                <td>${sessionStorage.getItem('plan')}</td>
                                <td>${amount} USD</td>
                            </tr>
                            <tr class="total">
                                <td></td>
                                <td>Total: ${amount} USD</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;

            try {
                const email = sessionStorage.getItem('email');
                const plan = sessionStorage.getItem('plan');
                const user = sessionStorage.getItem('uid');
                const subscription = jsonData.customer_code;
                const subscriberId = jsonData.subscription_code;
                const method = sessionStorage.getItem('method');
                const postURL = serverURL + '/api/sendreceipt';
                await axios.post(postURL, { html, email, plan, subscriberId, user, method, subscription });
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    }, []);

    const getDetails = useCallback(async () => {
        if (sessionStorage.getItem('method') === 'paystack') {
            const dataToSend = {
                email: sessionStorage.getItem('email'),
                uid: sessionStorage.getItem('uid'),
                plan: sessionStorage.getItem('plan')
            };
            const postURL = serverURL + '/api/paystackfetch';
            try {
                const res = await axios.post(postURL, dataToSend);
                const data = res.data.details;
                setJsonData(data);
                sessionStorage.setItem('type', sessionStorage.getItem('plan'));
                setIsLoading(false);
                sendEmail(data);
            } catch (error) {
                console.error("Error fetching details:", error);
                setIsLoading(false);
            }
        }
    }, [sendEmail]);

    const download = useCallback(async () => {
        if (sessionStorage.getItem('method') === 'paystack') {
            const amount = sessionStorage.getItem('plan') === MonthType ? MonthCost : YearCost;
            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
                    <style>
                        .invoice-box { max-width: 800px; margin: auto; padding: 30px; font-size: 16px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; }
                        .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
                        .invoice-box table td { padding: 5px; vertical-align: top; }
                        .invoice-box table tr td:nth-child(2) { text-align: right; }
                        .invoice-box table tr.top table td { padding-bottom: 20px; }
                        .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
                        .invoice-box table tr.information table td { padding-bottom: 40px; }
                        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
                        .invoice-box table tr.details td { padding-bottom: 20px; }
                        .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
                        .invoice-box table tr.item.last td { border-bottom: none; }
                        .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td { width: 100%; display: block; text-align: center; }
                            .invoice-box table tr.information table td { width: 100%; display: block; text-align: center; }
                        }
                        .invoice-box.rtl { direction: rtl; font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; }
                        .invoice-box.rtl table { text-align: right; }
                        .invoice-box.rtl table tr td:nth-child(2) { text-align: left; }
                    </style>
                </head>
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img src=${logo} style="width: 100%; max-width: 50px" />
                                            </td>
                                            <td>
                                                Subscription Id: ${jsonData.subscription_code}<br />
                                                Customer ID: ${jsonData.customer_code}<br />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                                <strong>${company}</strong>
                                                <br />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="heading">
                                <td>Payment Method</td>
                                <td></td>
                            </tr>
                            <tr class="details">
                                <td>${sessionStorage.getItem('method')}</td>
                                <td></td>
                            </tr>
                            <tr class="heading">
                                <td>Item</td>
                                <td>Price</td>
                            </tr>
                            <tr class="item">
                                <td>${sessionStorage.getItem('plan')}</td>
                                <td>${amount} USD</td>
                            </tr>
                            <tr class="total">
                                <td></td>
                                <td>Total: ${amount} USD</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;
            try {
                setProcessing(true);
                const email = sessionStorage.getItem('email');
                const postURL = serverURL + '/api/downloadreceipt';
                const res = await axios.post(postURL, { html, email });
                if (res.data.success) {
                    showToast(res.data.message);
                } else {
                    setProcessing(false);
                }
            } catch (error) {
                console.error('Error downloading receipt:', error);
                setProcessing(false);
            }
        }
    }, [jsonData]);

    const showToast = (msg) => {
        setProcessing(false);
        toast(msg, {
            position: 'bottom-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
        });
    };

    useEffect(() => {
        getDetails();
    }, [getDetails]);

    return (
        <div className='h-screen flex flex-col'>
            <Header isHome={true} className="sticky top-0 z-50" />
            <div className='dark:bg-black flex-1'>
                <div className='flex-1 flex flex-col items-center justify-center py-8'>
                    <p className='text-center font-black text-4xl text-black dark:text-white'>Thank You🎉</p>
                    <p className='text-center font-normal text-black py-4 dark:text-white'>
                        <strong>{sessionStorage.getItem('mName')}</strong> for subscribing to our <strong>{sessionStorage.getItem('plan')}</strong> Plan. <br />
                        Download your Receipt
                    </p>
                    <Button
                        onClick={download}
                        isProcessing={processing}
                        processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                        className='items-center justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none max-w-sm enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent'
                        type="submit"
                    >
                        Download
                    </Button>
                    {isLoading && (
                        <div className="text-center py-10 w-screen flex items-center justify-center">
                            <Spinner size="xl" className='fill-black dark:fill-white' />
                        </div>
                    )}
                    {!isLoading && <ReceiptDisplayPayStack jsonData={jsonData} />}
                </div>
            </div>
            <Footers className="sticky bottom-0 z-50" />
        </div>
    );
};

export default Success;
