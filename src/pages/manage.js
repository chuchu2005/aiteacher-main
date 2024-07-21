import React, { useEffect, useState } from "react";
import Header from "../components/header";
import Footers from "../components/footers";
import { Button, Spinner } from "flowbite-react";
import {
  serverURL,
} from "../constants";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading } from "react-icons/ai";
import { toast } from "react-toastify";
import SubscriptionDetailsPayStack from "../components/subscriptionDetailsPayStack";
import SubscriptionDetailsFlutterwave from "../components/SubscriptionDetailsFlutterwave";

const Manage = () => {
  const [jsonData, setJsonData] = useState({});
  const [jsonData2, setJsonData2] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [method, setMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processing2, setProcessing2] = useState(false);

  const navigate = useNavigate();

  const GetMethod = async (email) => {
    const dataToSend = { email };
    const postURL = `${serverURL}/api/fetchPaymentMethod`;
    const res = await axios.post(postURL, dataToSend);
    return res.data.method;
  };

  useEffect(() => {
    const Email = sessionStorage.getItem('email');
    if (sessionStorage.getItem('type') === 'free') {
      navigate('/pricing');
    } else {
      const fetchMethod = async () => {
        if (!sessionStorage.getItem('method')) {
          const method = await GetMethod(Email);
          const sessionData = { method, email: Email };
          sessionStorage.setItem('method', method);
          setMethod(sessionData.method);
          getDetails(sessionData); // Assuming getDetails is defined elsewhere
        } else {
          const sessionData = {
            method: sessionStorage.getItem('method'),
            email: Email,
          };
          setMethod(sessionData.method);
          getDetails(sessionData); // Assuming getDetails is defined elsewhere
        }
      };

      fetchMethod();
    }
  }, [navigate]);

  async function getDetails(SessionData) {
    const { method, email } = SessionData;
    if (method === "flutterwave") {
      setIsLoading(true);
      try {
        const dataToSend = { email: email};
        const postURL = `${serverURL}/api/flutterwavedetailsManage`;
        const response = await axios.post(postURL, dataToSend);
        console.log(response);
        setJsonData2(response.data.data[0]);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      const dataToSend = {
        uid: sessionStorage.getItem("uid"),
      };
      try {
        const postURL = serverURL + "/api/subscriptiondetail";
        await axios.post(postURL, dataToSend).then((res) => {
          setJsonData(res.data.session);
          setMethod(res.data.method);
          sessionStorage.setItem("method", res.data.method);
          setIsLoading(false);
        });
      } catch (error) {
        //DO NOTHING
      }
    }
  }

  const showToast = async (msg) => {
    setProcessing(false);
    setProcessing2(false);
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

  async function modifySubscription() {
    if (method === "flutterwave") {
      navigate("/updatePayment")
    } else {
      showToast(
        "You cannot modify the plan because you have not subscribed via flutterwave"
      );
    }
  }

  async function cancelSubscription() {
    try {
      setProcessing(true);
      if (method === "paystack") {
        const dataToSends = {
          code: jsonData.subscription_code,
          token: jsonData.email_token,
          email: sessionStorage.getItem("email"),
        };
        const postURL = serverURL + "/api/paystackcancel";
        await axios.post(postURL, dataToSends).then((res) => {
          showToast("Subscription Cancelled");
          sessionStorage.setItem("type", "free");
          navigate("/pricing");
        });
      } else if (method === "flutterwave") {
        showToast('Cancelation Through email link sended before.')
      }} catch (error) {
        cancelSubscription();
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Header isHome={true} className="sticky top-0 z-50" />
      <div className="dark:bg-black flex-1">
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-center font-black text-4xl text-black dark:text-white">
            Subscription
          </p>
          {isLoading && (
            <div className="text-center py-10 w-screen flex items-center justify-center">
              <Spinner size="xl" className="fill-black dark:fill-white" />
            </div>
          )}
          { method === "paystack"
            ? !isLoading && (
                <SubscriptionDetailsPayStack
                  jsonData={jsonData}
                  plan={sessionStorage.getItem("type")}
                  method={method}
                />
              )
            : method === "flutterwave"
            ? !isLoading && (
                <SubscriptionDetailsFlutterwave
                  jsonData={jsonData2}
                  plan={sessionStorage.getItem("type")}
                  method={method}
                />
              ):<></>}
          <div className="max-w-md">
            <Button
              isProcessing={processing}
              processingSpinner={
                <AiOutlineLoading className="h-6 w-6 animate-spin" />
              }
              className="my-2 items-center justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none w-full enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent"
              onClick={cancelSubscription}
            >
              Cancel Subscription
            </Button>
          </div>
          <div className="max-w-md">
            <Button
              isProcessing={processing2}
              processingSpinner={
                <AiOutlineLoading className="h-6 w-6 animate-spin" />
              }
              className="my-2 items-center justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none w-full enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent"
              onClick={modifySubscription}
            >
              Modify Subscription
            </Button>
          </div>
        </div>
      </div>
      <Footers className="sticky bottom-0 z-50" />
    </div>
  );
};

export default Manage;
