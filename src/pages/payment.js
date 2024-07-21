import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Footers from "../components/footers";
import { Button, Label, Select } from "flowbite-react";
import axios from "axios";
import {
  amountInZarOne,
  amountInZarTwo,
  name,
  paystackEnabled,
  paystackPlanIdOne,
  paystackPlanIdTwo,
  serverURL,
  flutterwaveEnabled,
  flutterwavePlanIdMonthly,
  flutterwavePlanIdYearly,
  amountInGBPMonthly,
  amountInGBPYearly,
} from "../constants";
import { useLocation, useNavigate } from "react-router-dom";
import countryList from "react-select-country-list";
import { toast } from "react-toastify";

const Payment = () => {
  const [publicKey, setPublicKey] = useState("");
  const [encKey, setEncKey] = useState("");
  const [email, setEmail] = useState(sessionStorage.getItem("email"));
  const [address, setAdress] = useState("");
  const [mName, setName] = useState(sessionStorage.getItem("mName"));
  const [lastName, setLastName] = useState("");
  const [post, setPost] = useState("");
  const [country, setCountry] = useState("");
  const [admin, setAdmin] = useState("");
  const options = useMemo(() => countryList().getData(), []);
  const { state } = useLocation();
  const { plan } = state || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (!plan) {
      navigate("/pricing");
    }
  }, [navigate, plan]);

  async function startPaystack() {
    if (
      !email ||
      !mName ||
      !lastName ||
      !post ||
      !address ||
      !country ||
      !admin
    ) {
      showToast("Please fill in all required fields");
      return;
    }
    let planId = paystackPlanIdTwo;
    let amountInZar = amountInZarTwo;
    if (plan === "Monthly Plan") {
      planId = paystackPlanIdOne;
      amountInZar = amountInZarOne;
    }
    const dataToSend = {
      planId: planId,
      amountInZar,
      email: email,
    };
    try {
      const postURL = serverURL + "/api/paystackpayment";
      const res = await axios.post(postURL, dataToSend);
      showToast(`Payment initialize: ${res.data.data.message}`);
      sessionStorage.setItem("paystack", res.data.data.data.reference);
      sessionStorage.setItem("method", "paystack");
      sessionStorage.setItem("plan", plan);
      window.location.href = res.data.data.data.authorization_url;
    } catch (error) {
      showToast(`Payment initialize: ${error}`);
    }
  }

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await axios.get(`${serverURL}/api/keys`);
        setPublicKey(response.data.publicKey);
        setEncKey(response.data.enckey);
      } catch (error) {
        console.error("Error fetching public key:", error);
      }
    };

    fetchPublicKey();
  }, []);

  async function startFlutterwave() {
    if (!email || !name || !plan || !country) {
      showToast("Please fill in all required fields");
      return;
    }

    let planId = flutterwavePlanIdYearly;
    let amount = amountInGBPYearly;
    if (plan === "Monthly Plan") {
      planId = flutterwavePlanIdMonthly;
      amount = amountInGBPMonthly;
    }

    try {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: Date.now() + plan + country,
          amount: amount,
          payment_plan: planId,
          currency: "GBP",
          redirect_url: "/successflw",
          payment_options: "card",
          enckey: encKey,
          customer: {
            email: email,
            name: name,
          },
          callback: function () {},
          onclose: function () {
            showToast("Payment canceled by user.");
          },
          customizations: {
            title: "Learnrithm",
            description: "pay for your plan of cost :",
            logo: "https://cdn.iconscout.com/icon/premium/png-256-thumb/payment-2193968-1855546.png",
          },
        });
      };

      sessionStorage.setItem("method", "flutterwave");
      sessionStorage.setItem("plan", plan);
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
      progress: undefined,
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <Header isHome={true} className="sticky top-0 z-50" />
      <div className="dark:bg-black flex-1">
        <div className="flex-1 flex items-center justify-center py-10">
          <form className="max-w-sm m-auto py-4 no-scrollbar">
            <p className="text-center font-black text-4xl text-black dark:text-white">
              Payment
            </p>
            <p className="text-center font-normal text-black py-4 dark:text-white">
              Enter your details and select payment gateway to continue
            </p>
            <div className="py-6">
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="email1"
                    value="Email"
                  />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-black focus:border-black border border-black font-normal bg-white rounded-none block w-full dark:bg-black dark:border-white dark:text-white"
                  id="email1"
                  type="email"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="name1"
                    value="First Name"
                  />
                </div>
                <input
                  value={mName}
                  onChange={(e) => setName(e.target.value)}
                  className="focus:ring-black focus:border-black border border-black font-normal bg-white rounded-none block w-full dark:bg-black dark:border-white dark:text-white"
                  id="name1"
                  type="text"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="name2"
                    value="Last Name"
                  />
                </div>
                <input
                  onChange={(e) => setLastName(e.target.value)}
                  className="focus:ring-black focus:border-black border border-black font-normal bg-white rounded-none block w-full dark:bg-black dark:border-white dark:text-white"
                  id="name2"
                  type="text"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="address1"
                    value="Address"
                  />
                </div>
                <input
                  onChange={(e) => setAdress(e.target.value)}
                  className="focus:ring-black focus:border-black border border-black font-normal bg-white rounded-none block w-full dark:bg-black dark:border-white dark:text-white"
                  id="address1"
                  type="text"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="post1"
                    value="Postal Code"
                  />
                </div>
                <input
                  onChange={(e) => setPost(e.target.value)}
                  className="focus:ring-black focus:border-black border border-black font-normal bg-white rounded-none block w-full dark:bg-black dark:border-white dark:text-white"
                  id="post1"
                  type="number"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 block">
                  <Label
                    className="font-bold text-black dark:text-white"
                    htmlFor="code1"
                    value="Country Code"
                  />
                </div>
                <Select
                  class="rounded-none border-black focus:ring-black focus:border-black border  font-normal bg-white  block w-full dark:bg-black dark:border-white dark:text-white"
                  value={country}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const selectedOption = options.find(
                      (country) => country.value === selectedValue
                    );
                    setCountry(selectedOption.value);
                    setAdmin(selectedOption.label);
                  }}
                >
                  {options.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </Select>
              </div>
              {flutterwaveEnabled ? (
                <Button
                  className="my-2 items-center justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none w-full enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent"
                  onClick={startFlutterwave}
                >
                  Pay with Flutterwave!
                </Button>
              ) : (
                <></>
              )}
              {paystackEnabled ? (
                <Button
                  className="my-2 items-center justify-center text-center dark:bg-white dark:text-black bg-black text-white font-bold rounded-none w-full enabled:hover:bg-black enabled:focus:bg-black enabled:focus:ring-transparent dark:enabled:hover:bg-white dark:enabled:focus:bg-white dark:enabled:focus:ring-transparent"
                  onClick={startPaystack}
                >
                  Paystack
                </Button>
              ) : (
                <></>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footers className="sticky bottom-0 z-50" />
    </div>
  );
};

export default Payment;
