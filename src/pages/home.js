import React, { useEffect } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import UserCourses from '../components/usercourses';
import { serverURL } from "../constants";
import axios from 'axios';
import { toast } from 'react-toastify';

const Home = () => {

    const Email = sessionStorage.getItem('email');

    useEffect(() => {
        const TestPayment = async (email) => {
            try {
                const dataToSend = { email };
                const postURL = `${serverURL}/api/expiredPaymentValidation`;
                const res = await axios.post(postURL, dataToSend);
    
                if (res.data.expired === true) {
                    showToast("You are in The Free Plan");
                } else {
                    sessionStorage.setItem("expiredDate", res.data.expiredDate)
                    showToast(`You are in ${sessionStorage.getItem("type")} way`);
                }
            } catch (error) {
                showToast("An error occurred during payment validation");
            }
        };
        TestPayment(Email);
    }, [Email]);
    
    
    const showToast = async (msg) => {
        toast(msg, {
          position: "bottom-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        };    

    return (
        <div className='h-screen flex flex-col'>
            <Header isHome={true} className="sticky top-0 z-50" />
            <div className='dark:bg-black flex-1'>
                <div className='pb-10'>
                    <UserCourses userId={sessionStorage.getItem('uid')} />
                </div>
            </div>
            <Footers className="sticky bottom-0 z-50" />
        </div>
    );
};

export default Home;