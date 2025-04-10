import AppError from "../utils/error.utils.js";

import jwt from "jsonwebtoken";



const isLoggedIn= async (req,res,next)=>{
    let token=req.cookies.token;

    console.log("🧪 Cookie token:", token);

     if (!token && req.headers.authorization?.startsWith("Bearer ")) {
       token = req.headers.authorization.split(" ")[1];
     }

    if(!token)
    {
        return next(new AppError("Unauthenticated, please login again",401))
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    req.user=userDetails;

    next();
}

const authorizedRoles= (...roles)=> async(req,res,next)=>{
    const currentUserRole=req.user.role;
    if(!roles.includes(currentUserRole))
    {
        return next(new AppError("You do not have permission to perform this action",403))
    }
    next();
}

const authorizeSubscriber=async(req,res,next)=>{
    const subscription=req.user.subscription;
    const currentUserRole=req.user.role;

    if(currentUserRole!=='ADMIN' && subscription.status!=='active')
    {
        return next(
            new AppError("You do not have permission to perform this action",403)
        );
    }
    next();
}

export { isLoggedIn, authorizedRoles, authorizeSubscriber };