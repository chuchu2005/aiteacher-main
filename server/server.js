//IMPORT
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const path = require("path");
const gis = require("g-i-s");
const youtubesearchapi = require("youtube-search-api");
const { YoutubeTranscript } = require("youtube-transcript");
const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");
const { createApi } = require("unsplash-js");
const showdown = require("showdown");
const axios = require("axios");
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY  );
//INITIALIZE
const app = express();
app.use(cors());
const PORT = process.env.PORT;
app.use(bodyParser.json());

const url = process.env.MONGODB_URI;

if(!url){
  console.log("error fetching url")
}

mongoose.connect(url, {
  useUnifiedTopology: true,
});
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

//SCHEMA
const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  type: { type: String, required: true },
  total: { type: Number, default: 0 },
  terms: { type: String, default: "" },
  privacy: { type: String, default: "" },
  cancel: { type: String, default: "" },
  refund: { type: String, default: "" },
  billing: { type: String, default: "" },
});
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
  type: String,
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  streak: { type: Number, default: 0 },
  lastLogin: { type: Date, default: null },
});

app.post("/api/updateStreak", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentDate = new Date();
    const lastLoginDate = new Date(user.lastLogin);
    const diffTime = Math.abs(currentDate - lastLoginDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak += 1;
    } else if (diffDays > 1) {
      user.streak = 1; // Reset streak if more than a day has passed
    }

    user.lastLogin = currentDate;
    await user.save();

    res.json({ success: true, streak: user.streak });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
/// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ streak: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error", users: [] });
  }
});
const courseSchema = new mongoose.Schema({
  user: String,
  content: { type: String, required: true },
  type: String,
  mainTopic: String,
  photo: String,
  date: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
});
const subscriptionSchema = new mongoose.Schema({
  user: String,
  subscription: String,
  subscriberId: String,
  plan: String,
  method: String,
  date: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});
const contactShema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  phone: Number,
  msg: String,
  date: { type: Date, default: Date.now },
});

//MODEL
const User = mongoose.model("User", userSchema);
const Course = mongoose.model("Course", courseSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const Contact = mongoose.model("Contact", contactShema);
const Admin = mongoose.model("Admin", adminSchema);

//REQUEST

//SIGNUP
app.post("/api/signup", async (req, res) => {
  const { email, mName, password, type } = req.body;

  try {
    const estimate = await User.estimatedDocumentCount();
    if (estimate > 0) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          success: false,
          message: "User with this email already exists",
        });
      }
      const newUser = new User({ email, mName, password, type });
      await newUser.save();
      res.json({
        success: true,
        message: "Account created successfully",
        userId: newUser._id,
      });
    } else {
      const newUser = new User({ email, mName, password, type });
      await newUser.save();
      const newAdmin = new Admin({ email, mName, type: "main" });
      await newAdmin.save();
      res.json({
        success: true,
        message: "Account created successfully",
        userId: newUser._id,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//SIGNIN
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    if (password === user.password) {
      return res.json({
        success: true,
        message: "SignIn successful",
        userData: user,
      });
    }

    res.json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Invalid email or password" });
  }
});

//SEND MAIL
app.post("/api/data", async (req, res) => {
  const receivedData = req.body;

  try {
    const emailHtml = receivedData.html;

    const options = {
      from: process.env.EMAIL,
      to: receivedData.to,
      subject: receivedData.subject,
      html: emailHtml,
    };

    const data = await transporter.sendMail(options);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});

//FOROGT PASSWORD
app.post("/api/forgot", async (req, res) => {
  const { email, name, company, logo } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: `${name} Password Reset`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Password Reset<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
              <body style="margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:rgb(255,255,255);font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:37.5em;margin-left:auto;margin-right:auto;margin-top:40px;margin-bottom:40px;width:465px;border-radius:0.25rem;border-width:1px;border-style:solid;border-color:rgb(234,234,234);padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${logo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Password Reset</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Click on the button below to reset the password for your account ${email}.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                        <tbody>
                          <tr>
                            <td><a href="${resetLink}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color:rgb(0,0,0);text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reset</span></a></td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${company}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "I am the problem" });
  }
});

//FOROGT PASSWORD
app.post("/api/reset-password", async (req, res) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: true, message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET DATA FROM MODEL
app.post("/api/prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt is required' });
  }

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    safetySettings,
  });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    res.status(200).json({ success: true, generatedText });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});


//GET GENERATE THEORY
app.post("/api/generate", async (req, res) => {
  const receivedData = req.body;

  const promptString = receivedData.prompt;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    safetySettings,
  });

  const prompt = promptString;

  await model
    .generateContent(prompt)
    .then((result) => {
      const response = result.response;
      const txt = response.text();
      const converter = new showdown.Converter();
      const markdownText = txt;
      const text = converter.makeHtml(markdownText);
      res.status(200).json({ text });
    })
    .catch((error) => {
      res.status(500).json({ success: false, message: "I am the problem " });
    });
});

//GET IMAGE
app.post("/api/image", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  gis(promptString, logResults);
  function logResults(error, results) {
    if (error) {
      //ERROR
    } else {
      res.status(200).json({ url: results[0].url });
    }
  }
});

//GET VIDEO
app.post("/api/yt", async (req, res) => {
  try {
    const receivedData = req.body;
    const promptString = receivedData.prompt;
    const video = await youtubesearchapi.GetListByKeyword(
      promptString,
      [false],
      [1],
      [{ type: "video" }]
    );
    const videoId = await video.items[0].id;
    res.status(200).json({ url: videoId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET TRANSCRIPT
app.post("/api/transcript", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  YoutubeTranscript.fetchTranscript(promptString)
    .then((video) => {
      res.status(200).json({ url: video });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

//STORE COURSE
app.post("/api/course", async (req, res) => {
  const { user, content, type, mainTopic } = req.body;

  unsplash.search
    .getPhotos({
      query: mainTopic,
      page: 1,
      perPage: 1,
      orientation: "landscape",
    })
    .then(async (result) => {
      const photos = result.response.results;
      const photo = photos[0].urls.regular;
      try {
        const newCourse = new Course({ user, content, type, mainTopic, photo });
        await newCourse.save();
        res.json({
          success: true,
          message: "Course created successfully",
          courseId: newCourse._id,
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });
});

//UPDATE COURSE
app.post("/api/update", async (req, res) => {
  const { content, courseId } = req.body;
  try {
    await Course.findOneAndUpdate({ _id: courseId }, [
      { $set: { content: content } },
    ])
      .then((result) => {
        res.json({ success: true, message: "Course updated successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/finish", async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { completed: true, end: Date.now() } }
    )
      .then((result) => {
        res.json({ success: true, message: "Course completed successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//SEND CERTIFICATE
app.post("/api/sendcertificate", async (req, res) => {
  const { html, email } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Certification of completion",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: "Failed to send email" });
    } else {
      res.json({ success: true, message: "Email sent successfully" });
    }
  });
});

//GET ALL COURSES
app.get("/api/courses", async (req, res) => {
  try {
    const { userId } = req.query;
    await Course.find({ user: userId }).then((result) => {
      res.json(result);
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//GET PROFILE DETAILS
app.post("/api/profile", async (req, res) => {
  const { email, mName, password, uid } = req.body;
  try {
    if (password === "") {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    } else {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName, password: password } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET SUBSCRIPTION DETAILS
app.post("/api/subscriptiondetail", async (req, res) => {
  try {
    const { uid } = req.body;

    const userDetails = await Subscription.findOne({ user: uid });
    if (userDetails.method === "paystack") {
      const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
      const response = await axios.get(
        `https://api.paystack.co/subscription/${userDetails.subscriberId}`,
        {
          headers: {
            Authorization: authorization,
          },
        }
      );

      let subscriptionDetails = null;
      subscriptionDetails = {
        subscription_code: response.data.data.subscription_code,
        createdAt: response.data.data.createdAt,
        updatedAt: response.data.data.updatedAt,
        customer_code: userDetails.subscription,
        email_token: response.data.data.email_token,
      };

      res.json({ session: subscriptionDetails, method: userDetails.method });
    }
  } catch (error) {
    //DO NOTHING
  }
});

//DOWNLOAD RECEIPT
app.post("/api/downloadreceipt", async (req, res) => {
  const { html, email } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Subscription Receipt",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to send receipt" });
    } else {
      res.json({ success: true, message: "Receipt sent to your mail" });
    }
  });
});

//SEND RECEIPT
app.post("/api/sendreceipt", async (req, res) => {
  const { html, email, plan, subscriberId, user, method, subscription } =
    req.body;

  const existingSubscription = await Subscription.findOne({ user: user });
  if (existingSubscription) {
    //DO NOTHING
  } else {
    const newSub = new Subscription({
      user,
      subscription,
      subscriberId,
      plan,
      method,
    });
    await newSub.save();
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Subscription Receipt",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to send receipt" });
    } else {
      res.json({ success: true, message: "Receipt sent to your mail" });
    }
  });
});

//CONTACT
app.post("/api/contact", async (req, res) => {
  const { fname, lname, email, phone, msg } = req.body;
  try {
    const newContact = new Contact({ fname, lname, email, phone, msg });
    await newContact.save();
    res.json({ success: true, message: "Submitted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//ADMIN PANEL

//DASHBOARD
app.post("/api/dashboard", async (req, res) => {
  const users = await User.estimatedDocumentCount();
  const courses = await Course.estimatedDocumentCount();
  const admin = await Admin.findOne({ type: "main" });
  const total = admin.total;
  const monthlyPlanCount = await User.countDocuments({
    type: process.env.MONTH_TYPE,
  });
  const yearlyPlanCount = await User.countDocuments({
    type: process.env.YEAR_TYPE,
  });
  let monthCost = monthlyPlanCount * process.env.MONTH_COST;
  let yearCost = yearlyPlanCount * process.env.YEAR_COST;
  let sum = monthCost + yearCost;
  let paid = yearlyPlanCount + monthlyPlanCount;
  const videoType = await Course.countDocuments({
    type: "video & text course",
  });
  const textType = await Course.countDocuments({
    type: "theory & image course",
  });
  let free = users - paid;
  res.json({
    users: users,
    courses: courses,
    total: total,
    sum: sum,
    paid: paid,
    videoType: videoType,
    textType: textType,
    free: free,
    admin: admin,
  });
});

//GET USERS
app.get("/api/getusers", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    //DO NOTHING
  }
});

//GET COURES
app.get("/api/getcourses", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    //DO NOTHING
  }
});

//GET PAID USERS
app.get("/api/getpaid", async (req, res) => {
  try {
    const paidUsers = await User.find({ type: { $ne: "free" } });
    res.json(paidUsers);
  } catch (error) {
    //DO NOTHING
  }
});

//GET ADMINS
app.get("/api/getadmins", async (req, res) => {
  try {
    const users = await User.find({
      email: { $nin: await getEmailsOfAdmins() },
    });
    const admins = await Admin.find({});
    res.json({ users: users, admins: admins });
  } catch (error) {
    //DO NOTHING
  }
});

async function getEmailsOfAdmins() {
  const admins = await Admin.find({});
  return admins.map((admin) => admin.email);
}

//ADD ADMIN
app.post("/api/addadmin", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    const newAdmin = new Admin({
      email: user.email,
      mName: user.mName,
      type: "no",
    });
    await newAdmin.save();
    res.json({ success: true, message: "Admin added successfully" });
  } catch (error) {
    //DO NOTHING
  }
});

//REMOVE ADMIN
app.post("/api/removeadmin", async (req, res) => {
  const { email } = req.body;
  try {
    await Admin.findOneAndDelete({ email: email });
    res.json({ success: true, message: "Admin removed successfully" });
  } catch (error) {
    //DO NOTHING
  }
});

//GET CONTACTS
app.get("/api/getcontact", async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.json(contacts);
  } catch (error) {
    //DO NOTHING
  }
});

//SAVE ADMIN
app.post("/api/saveadmin", async (req, res) => {
  const { data, type } = req.body;
  try {
    if (type === "terms") {
      await Admin.findOneAndUpdate(
        { type: "main" },
        { $set: { terms: data } }
      ).then((rl) => {
        res.json({ success: true, message: "Saved successfully" });
      });
    } else if (type === "privacy") {
      await Admin.findOneAndUpdate(
        { type: "main" },
        { $set: { privacy: data } }
      ).then((rl) => {
        res.json({ success: true, message: "Saved successfully" });
      });
    } else if (type === "cancel") {
      await Admin.findOneAndUpdate(
        { type: "main" },
        { $set: { cancel: data } }
      ).then((rl) => {
        res.json({ success: true, message: "Saved successfully" });
      });
    } else if (type === "refund") {
      await Admin.findOneAndUpdate(
        { type: "main" },
        { $set: { refund: data } }
      ).then((rl) => {
        res.json({ success: true, message: "Saved successfully" });
      });
    } else if (type === "billing") {
      await Admin.findOneAndUpdate(
        { type: "main" },
        { $set: { billing: data } }
      ).then((rl) => {
        res.json({ success: true, message: "Saved successfully" });
      });
    }
  } catch (error) {
    //DO NOTHING
  }
});

//GET POLICIES
app.get("/api/policies", async (req, res) => {
  try {
    const admins = await Admin.find({});
    res.json(admins);
  } catch (error) {
    //DO NOTHING
  }
});

// PAYSTACK PAYMENT
app.post("/api/paystackpayment", async (req, res) => {
  const { planId, amountInZar, email } = req.body;
  try {
    const data = {
      email: email,
      amount: amountInZar * 100, // Paystack expects amount in kobo
      plan: planId,
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      data,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      res.json({ data: response.data });
    } else {
      res.status(500).json({ error: "Paystack initialization failed" });
    }
  } catch (error) {
    console.error("Error during Paystack initialization:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

//PAYSTACK GET DETAIL
app.post("/api/paystackfetch", async (req, res) => {
  const { email, uid, plan } = req.body;
  try {
    const searchEmail = email;
    const url = "https://api.paystack.co/subscription";
    const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;

    axios
      .get(url, {
        headers: {
          Authorization: authorization,
        },
      })
      .then(async (response) => {
        const jsonData = response.data;
        let subscriptionDetails = null;
        jsonData.data.forEach((subscription) => {
          if (subscription.customer.email === searchEmail) {
            subscriptionDetails = {
              subscription_code: subscription.subscription_code,
              createdAt: subscription.createdAt,
              updatedAt: subscription.updatedAt,
              customer_code: subscription.customer.customer_code,
            };
          }
        });

        if (subscriptionDetails) {
          let cost = 0;
          if (plan === process.env.MONTH_TYPE) {
            cost = process.env.MONTH_COST;
          } else {
            cost = process.env.YEAR_COST;
          }
          cost = cost / 4;

          await Admin.findOneAndUpdate(
            { type: "main" },
            { $inc: { total: cost } }
          );

          await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
            .then(async (result) => {
              console.log(subscriptionDetails);
              res.json({ details: subscriptionDetails });
            })
            .catch((error) => {
              res
                .status(500)
                .json({ success: false, message: "Internal server error" });
            });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      })
      .catch((error) => {
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PAYSTACK PAYMENT
app.post("/api/paystackcancel", async (req, res) => {
  const { code, token, email } = req.body;

  const url = "https://api.paystack.co/subscription/disable";
  const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
  const contentType = "application/json";
  const data = {
    code: code,
    token: token,
  };

  axios
    .post(url, data, {
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
      },
    })
    .then(async (response) => {
      const subscriptionDetails = await Subscription.findOne({
        subscriberId: code,
      });
      const userId = subscriptionDetails.user;

      await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

      const userDetails = await User.findOne({ _id: userId });
      await Subscription.findOneAndDelete({ subscriberId: code });

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        service: "gmail",
        secure: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const Reactivate = process.env.WEBSITE_URL + "/pricing";

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
                  <body style="margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:rgb(255,255,255);font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:37.5em;margin-left:auto;margin-right:auto;margin-top:40px;margin-bottom:40px;width:465px;border-radius:0.25rem;border-width:1px;border-style:solid;border-color:rgb(234,234,234);padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color:rgb(0,0,0);text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "" });
    });
});

//CHAT
app.post("/api/chat", async (req, res) => {
  const receivedData = req.body;

  const promptString = receivedData.prompt;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
  });

  const prompt = promptString;

  await model
    .generateContent(prompt)
    .then((result) => {
      const response = result.response;
      const txt = response.text();
      const converter = new showdown.Converter();
      const markdownText = txt;
      const text = converter.makeHtml(markdownText);
      res.status(200).json({ text });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

//Fetch Payment Method
app.post("/api/fetchPaymentMethod", async (req, res) => {
  const { email } = req.body;

  let subscribed = await Subscription.findOne({ user: email });

  if (!subscribed) {
    res.status(404).json({ error: "Subscription not found" });
  } else {
    res.status(200).json({ method: subscribed.method });
  }
});

// Utility function to check if the subscription is active
const isActiveSubscription = (expiredDate) => {
  const currentDate = new Date();
  return currentDate < new Date(expiredDate);
};

// Flutterwave Handler
app.post("/api/flutterwavePaymentHandel", async (req, res) => {
  try {
    const { email, plan, method, flwId, tx_ref } = req.body; // Extract from request body

    // Fetch subscription info
    let subscribed = await Subscription.findOne({ user: email });

    // Expired date manip

    if (!subscribed) {
      const user = email;
      const date = new Date();

      const active = "true";
      const subscription = flwId;
      const subscriberId = tx_ref;

      const subs = new Subscription({
        user,
        subscription,
        subscriberId,
        plan,
        method,
        date,
        active,
      });
      await subs.save();

      await User.findOneAndUpdate(
        { email }, // filter
        { type: plan }, // update
        { new: true } // options: return the updated document
      );
    } else {

      const date = new Date();
      let expiredDate;

      if (plan === "Monthly Plan") {
        expiredDate = new Date(date.setMonth(date.getMonth() + 1));
      } else if (plan === "Yearly Plan") {
        expiredDate = new Date(date.setFullYear(date.getFullYear() + 1));
      }

      // Update existing subscription
      subscribed.plan = plan;
      subscribed.method = method;
      subscribed.date = Date.now();
      subscribed.active = isActiveSubscription(expiredDate);
      subscribed.subscription = flwId;
      subscribed.subscriberId = tx_ref;
      await subscribed.save();
      await User.findOneAndUpdate(
        { email }, // filter
        { type: plan }, // update
        { new: true } // options: return the updated document
      );
    }

    res.status(200).json({ message: "Subscription handled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while handling the subscription" });
  }
});

// Flutterwave Payment Route of Managing
app.post("/api/flutterwavedetailsManage", async (req, res) => {
  const { email } = req.body;

  try {
    const sub = await Subscription.findOne({ user: email });

    if (!sub) {
      console.error("Subscription not found for user email:", email);
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Perform the API request to Flutterwave
    const allSubscriptions = await flw.Subscription.fetch_all();
    const userSubscriptions = allSubscriptions.data.filter(subscription => subscription.customer.customer_email === email);
    userSubscriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({data: userSubscriptions})

  } catch (error) {
    console.error("Flutterwave fetch Payment details Error:", error.message);
    res.status(500).json({ error: "Flutterwave Payment Failed" });
  }
});

// Flutterwave public key

app.get("/api/keys", (req, res) => {
  const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
  const encKey = process.env.FLUTTERWAVE_ENC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: "key not found" });
  }
  res.json({ publicKey:  publicKey, encKey: encKey});
});

// Test of Flutterwave Payment validation
app.post("/api/expiredPaymentValidation", async (req, res) => {
  try {
    const { email } = req.body;

    // Find subscription and user info from your database
    let subscribed = await Subscription.findOne({ user: email });
    let userInfo = await User.findOne({ email });

    // Fetch all subscriptions from Flutterwave and filter by email
    const allSubscriptions = await flw.Subscription.fetch_all();
    const userSubscriptions = allSubscriptions.data.filter(subscription => subscription.customer.customer_email === email);
    userSubscriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (userSubscriptions.length === 0) {
      return res.json({ expired: false, message: "No subscriptions found" });
    }

    // Determine the plan type
    let plan = 'Yearly Plan';
    if (userSubscriptions[0].plan === 67117) {
      plan = 'Monthly Plan';
    }

    // Get the creation date of the latest subscription
    const creationDate = new Date(userSubscriptions[0].created_at);
    let expiredDate;

    // Calculate the expiration date based on the plan type
    if (plan === "Monthly Plan") {
      expiredDate = new Date(creationDate.setMonth(creationDate.getMonth() + 1));
    } else if (plan === "Yearly Plan") {
      expiredDate = new Date(creationDate.setFullYear(creationDate.getFullYear() + 1));
    }

    // Check the subscription status and determine if it's expired
    const isExpired = userSubscriptions[0].status !== 'active' || new Date() > expiredDate;


    if (!subscribed) {
      res.json({ expired: false });
    } else {
     res.json({ expired: isExpired, expiredDate });
     if(isExpired){
      await Subscription.deleteOne({ user: email });

      userInfo.type = "free";
      await userInfo.save();
     }
    }

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));



// The "catchall" handler: for any request that doesn't match one above, send back the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

//LISTEN
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



