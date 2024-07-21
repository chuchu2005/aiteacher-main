import React, { useEffect, useState, useCallback } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { AiOutlineLoading } from 'react-icons/ai';
import { Button, Spinner } from 'flowbite-react';
import { MonthCost, MonthType, YearCost, company, logo, serverURL } from '../constants';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReceiptDisplayFlutterwave from '../components/ReceiptDisplayFlutterwave';

const Successflw = () => {
    const [processing, setProcessing] = useState(false);
    const [jsonData, setJsonData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [sessionData, setSessionData] = useState({
        method: '',
        email: '',
        plan: '',
        flwId: '',
        mName: ''
    });

    const generateHTML = useCallback((jsonData) => {
        const amount = sessionData.plan === MonthType ? MonthCost : YearCost;
        return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>Invoice</title>
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
                                            Subscription Id: ${jsonData.tx_ref}<br />
                                            Customer ID: ${jsonData.id}<br />
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
                            <td>${sessionData.method}</td>
                            <td></td>
                        </tr>
                        <tr class="heading">
                            <td>Item</td>
                            <td>Price</td>
                        </tr>
                        <tr class="item">
                            <td>${sessionData.plan}</td>
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
    }, [sessionData.plan, sessionData.method]);

    const sendEmail = useCallback(async (jsonData) => {
        const { method, email, plan } = sessionData;
        if (method === 'flutterwave') {
            try {
                const html = generateHTML(jsonData);
                const user = jsonData.email;
                const subscription = jsonData.tx_ref;
                const subscriberId = jsonData.id;
                const postURL = `${serverURL}/api/sendreceipt`;
                await axios.post(postURL, { html, email, plan, subscriberId, user, method, subscription });
            } catch (error) {
                console.error("Error sending email:", error);
            }
        }
    }, [sessionData, generateHTML]);

    const getDetails = useCallback(async () => {
        const { method, flwId, plan, tx_ref, email } = sessionData;
        if (method === 'flutterwave') {
            try {
                const postURLl = `${serverURL}/api/flutterwavePaymentHandel`;
                const res = await axios.post(postURLl, { email: sessionData.email, plan, method, flwId, tx_ref });
                
                if (res.status === 200) {
                    showToast(res.data.message)
                } else if (res.status === 500) {
                    showToast(res.data.error)
                }
                let amount = 20;
                if(plan === "Monthly Plan"){
                    amount=5;
                }

                let jsonData1 = {
                    email: email,
                    id : flwId,
                    tx_ref: tx_ref,
                    plan: plan,
                    status : "active",
                    amount: amount

                };
                setJsonData(jsonData1);
                sessionStorage.setItem('type', plan);
                setIsLoading(false);
                sendEmail(jsonData1);
            } catch (error) {
                console.error("Error fetching details:", error);
                setIsLoading(false);
            }
        }
    }, [sessionData, sendEmail]);
    
    const download = useCallback(async () => {
        const method = sessionStorage.getItem('method');
        if (method === 'flutterwave') {
            try {
                setProcessing(true);
                const html = generateHTML(jsonData);
                const email = sessionStorage.getItem('email');
                const postURL = `${serverURL}/api/downloadreceipt`;
                const response = await axios.post(postURL, { html, email });
                if (response.data.success) {
                    showToast(response.data.message);
                } else {
                    setProcessing(false);
                }
            } catch (error) {
                console.error("Error downloading receipt:", error);
                setProcessing(false);
            }
        }
    }, [jsonData, generateHTML]);

    const showToast = (msg) => {
        setProcessing(false);
        toast(msg, {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
        });
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setSessionData({
            method: sessionStorage.getItem('method'),
            email: sessionStorage.getItem('email'),
            plan: sessionStorage.getItem('plan'),
            flwId: urlParams.get('transaction_id'),
            tx_ref: urlParams.get('tx_ref'),
            mName: sessionStorage.getItem('mName')
        });
    }, []);

    useEffect(() => {
        if (sessionData.method === 'flutterwave') {
            getDetails();
        }
    }, [sessionData, getDetails]);

    return (
        <div className='h-screen flex flex-col'>
            <Header isHome={true} className="sticky top-0 z-50" />
            <div className='dark:bg-black flex-1'>
                <div className='flex-1 flex flex-col items-center justify-center py-8'>
                    <p className='text-center font-black text-4xl text-black dark:text-white'>Thank You🎉</p>
                    <p className='text-center font-normal text-black py-4 dark:text-white'><strong>{sessionData.mName}</strong> for subscribing to our <strong>{sessionData.plan}</strong> Plan. <br /> Download your Receipt</p>
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
                    {!isLoading && <ReceiptDisplayFlutterwave jsonData={jsonData} />}
                </div>
            </div>
            <Footers className="sticky bottom-0 z-50" />
        </div>
    );
};

export default Successflw;
