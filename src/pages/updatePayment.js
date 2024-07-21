import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footers from "../components/footers";
import Header from "../components/header";
import { Button } from "flowbite-react";
import { amountInGBPMonthly, amountInGBPYearly, flutterwavePlanIdMonthly, flutterwavePlanIdYearly, serverURL } from "../constants";
import axios from "axios";
import { toast } from "react-toastify";

const UpdatePayment = () => {
  const [Updatetype, setUpdatetype] = useState("Yearly Plan");
  const [publicKey, setPublicKey] = useState("");
  const [encKey, setEncKey] = useState("");

  const navigate = useNavigate();

  if (sessionStorage.getItem("type") === "free") {
    navigate("/pricing");
  }

  const user = {
    email: sessionStorage.getItem("email"),
    name : sessionStorage.getItem("mName"),
  };


  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await axios.get(`${serverURL}/api/keys`);
        setPublicKey(response.data.publicKey);
        setEncKey(response.data.enckey);
      } catch (error) {
        console.error("Error fetching key:", error);
      }
    };

    fetchPublicKey();
  }, []);



  let planId = flutterwavePlanIdYearly;
  let amount = amountInGBPYearly;
  if (Updatetype === "Monthly Plan") {
    planId = flutterwavePlanIdMonthly;
    amount = amountInGBPMonthly;
  }


  async function startFlutterwave() {

    try {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: user.name + Date.now(),
          amount: amount,
          payment_plan: planId,
          currency: "GBP",
          redirect_url: "/successflw",
          payment_options: "card",
          enckey: encKey,
          customer: {
            email: user.email,
            name: user.name,
          },
          callback: function (res) {
            if (res.data.data.status === "successful") {
              showToast(`Payment for ${Updatetype} is successful`);
            } else {
              showToast(`Payment for ${Updatetype} is failed`);
              navigate("/failed");
            }
          },
          onclose: function () {
            showToast("Payment canceled by user.");
          },
          customizations: {
            title: "Learnrithm",
            description: "Update your plan for cost :",
            logo: "https://cdn.iconscout.com/icon/premium/png-256-thumb/payment-2193968-1855546.png",
          },
        });
      };

      sessionStorage.setItem("method", "flutterwave");
      sessionStorage.setItem("plan", Updatetype);
    } catch (error) {
      console.error("Error setting up Flutterwave checkout:", error);
      showToast("Unexpected error occurred. Please try again later.");
    }
  }

  const showToast = async (msg) => {
        toast(msg, {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
        });
    }

    const expiredDateString = sessionStorage.getItem("expiredDate");
    const expiredDate = new Date(expiredDateString);
    
    const day = expiredDate.getDate().toString().padStart(2, '0');
    const month = (expiredDate.getMonth() + 1).toString().padStart(2, '0');
    const year = expiredDate.getFullYear();
    
    const formattedDate = `${day}-${month}-${year}`;

  return (
    <div className="h-screen flex flex-col justify-between dark:bg-black">
      <Header isHome={true} className="sticky top-0 z-50" />
      <div className="dark:bg-black items-center">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-center font-black text-4xl text-black dark:text-white">
            Update Your Plan
          </p>
          <div className="my-8"><p className="text-center font-normal text-black dark:text-white">
            <strong>Expired Date in :</strong>{" "}
            {formattedDate}
          </p>
          <p className="text-center font-normal text-black dark:text-white">
            <strong>User :</strong>{" "}
            {sessionStorage.getItem("mName")}
          </p>
          <p className="text-center font-normal text-black dark:text-white">
            <strong>email :</strong>{" "}
            {sessionStorage.getItem("email")}
          </p></div>
          <div className="flex justify-between w-96 mb-8">
            <button
              className={`w-1/2 rounded-none rounded-l-lg flex items-center justify-center py-2 ${
                Updatetype === "Yearly Plan"
                  ? "bg-black text-white dark:bg-white dark:text-black animate-pulse"
                  : "bg-white text-black dark:bg-black dark:text-white"
              }`}
              onClick={() => setUpdatetype("Yearly Plan")}
              type="button"
            >
              Yearly Plan 90$
            </button>
            <div className="w-0.5 bg-gray-300"></div>
            <button
              className={`w-1/2 rounded-none rounded-r-lg flex items-center justify-center py-2 transition-all ${
                Updatetype === "Monthly Plan"
                  ? "bg-black text-white dark:bg-white dark:text-black animate-pulse"
                  : "bg-white text-black dark:bg-black dark:text-white"
              }`}
              onClick={() => setUpdatetype("Monthly Plan")}
              type="button"
            >
              Monthly Plan 9$
            </button>
          </div>
          <Button
            className="items-center transition-all justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none w-96 enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent"
            onClick={startFlutterwave}
          >
            Pay with Flutterwave!
          </Button>
        </div>
      </div>
      <Footers className="sticky bottom-0 z-50" />
    </div>
  );
};

export default UpdatePayment;
