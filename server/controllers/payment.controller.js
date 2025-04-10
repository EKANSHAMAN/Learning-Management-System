import AppError from "../utils/error.utils.js";
import { razorpay } from "../server.js";
import User from "../models/user.model.js";
import crypto from "crypto";


export const getRazorpayApiKey= async(req,res,next)=>{
    try {
      res.status(200).json({
        success: true,
        message: "Razorpay API key",
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e) {
      return next(new AppError(e.message, 400));
    }
}

export const buySubscription= async(req,res,next)=>{
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, please login", 400));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin can't purchase the course"));
    }
    const subscription = await razorpay.subscription.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      subscription_id: subscription.id,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
}

export const verifySubscription= async(req,res,next)=>{
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, please login", 400));
    }

    const subscription_id = user.subscription.id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${subscription_id}`)
      .digest("hex");
    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified, please try again", 500));
    }

    await payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });
    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscription verified successfully",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }


}

export const cancelSubscription = async (req, res, next) => {
  try{
    const {id}=req.user;

  const user= await User.findById(id);

  if(!user)
  {
     return next(new AppError("Unauthorized, please login", 400));  
    }
  if(user.role==='ADMIN')
  {
    return next(new AppError("Unauthorized, you are an admin", 400));
  }
  const subscription_id = user.subscription_id;

  const subscription = await razorpay.subscriptions.cancel(subscription_id);

  user.subscription.status=subscription.status;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Subscription canceled successfully",
  });
  }
  catch(e)
  {
    return next(new AppError(e.message,400))
  }
};

export const allPayments = async (req, res, _next) => {
  const { count, skip } = req.query;

  const allPayments = await razorpay.subscriptions.all({
    count: count ? count : 10, 
    skip: skip ? skip : 0, 
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayments.items.map((payment) => {
    const monthsInNumbers = new Date(payment.start_at * 1000);

    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });

  res.status(200).json({
    success: true,
    message: "All payments",
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
};