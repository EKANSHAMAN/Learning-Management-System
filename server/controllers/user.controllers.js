import User from "../models/user.model.js";
import AppError from "../utils/error.utils.js";
import {v2 as cloudinary} from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cookieOptions=
{
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    secure:true     
}

const register =async(req,res,next)=>{
   const {fullName,email,password}=req.body;

   if(!fullName||!email||!password)
   {
    return next(new AppError("All fields are required",400));
   }

   const userExists=await User.findOne({email})

   if(userExists)
   {
    return next(new AppError("Email already exists",400));
   }

   const user = await User.create({
     fullName,
     email,
     password,
     avatar: {
       public_id: email,
       secure_url:
         "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
     },
   });
   let result;
   if(!user)
   {
    return next(new AppError("User registration failed, please try again",400));
   }

    console.log('File details >',JSON.stringify(req.file));

   if(req.file){
   
    try{
        result= await cloudinary.uploader.upload(req.file.path,{
            folder:"lms",
            width:250,
            height:250,
            gravity:"faces",
            crop:"fill",
        });
        console.log(user);
        console.log(result);

        // if(result)
        // {
        //     // user.avatar.public_id=result.public_id;
        //     // user.avatar.secure_url=result.secure_url;

        //     //remove file from server
        //     // console.log(`uploads/${req.file.filename}`);
        //     // fs.rm(`uploads/${req.file.filename}`);
        //     // return result.secure_url;
        //     // user.secure_url=result.secure_url


        // }

    }
    catch(e)
    {
        return next(
          new AppError(e.message || "Failed to upload avatar", 400)
        );


    }
   }

   await user.save();

   user.password=undefined; 

   const token= await user.generateJWTToken();  

   res.cookie('token',token,cookieOptions)

   res.status(201).json({
    success: true,
    message: "User registered successfully",
    result,
   })
};

const login =async(req,res,next)=>{
    try{
        const {email,password}=req.body;    

    if(!email||!password)
    {
        return next(new AppError("Email and password are required",400))
    }

    const user=await User.findOne({
        email
    }).select('+password');

    if(!user||!user.comparePassword(password))
    {
        return next(new AppError("Invalid email or password",400))
    }

    const token=await user.generateJWTToken();
    user.password= undefined;

    res.cookie('token',token,cookieOptions);

    res.status(200).json({
        success:true,
        message:"User logged in successfully",
        user,token
    })

    }
    catch(e){
         return next(new AppError(e.message,500))
    }
};

const logout=(req,res)=>{
    res.cookie('token',null,{
        secure:true,
        maxAge:0,
        httpOnly:true
    });
    res.status(200).json({
        success:true,
        message:"User logged out successfully"
    })
};

const getProfile=async (req,res)=>{

    try{
        const userId=req.user.id;
        const user=await User.findById(userId);
        res.status(200).json({
            success:true,
            message:"User profile retrieved successfully",
            user
        });
    }

    catch(e)
    {
        return next(new AppError("failed to fetch profile detail",500))
    }

    

};
const forgotPassword=async (req,res,next)=>{
    const {email}=req.body;

    if(!email)
    {
        return next(new AppError("Email is required",400))
    }

    const user= await User.findOne({email});
    if(!user)
    {
        return next(new AppError("Email is not registered",400));
    }

    const resetToken= await user.generatePasswordResetToken();
    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    //console.log(resetPasswordUrl);

    const subject='Reset Password';

    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    try{
        await sendEmail(email,subject,message);

        res.status(200).json({
            status:true,
            message:`Reset password token has been sent to ${email} successfully`
        })
    }
    catch(e)
    {
        user.forgetPasswordExpiry=undefined;
        user.forgetPasswordToken=undefined;

        await user.save();
        return next(new AppError(e.message,500));
    }

}

const resetPassword= async(req,res)=>{
    const {resetToken}=req.params;

    const {password}=req.body;

    const forgetPasswordToken=crypto
         .createHash('sha256')
         .update(resetToken)
         .digest('hex');

         const user= await User.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry:{$gt:Date.now()}
         });

         if(!user)
         {
            return next(new AppError("Token is invalid or has expired, please try again",404));
         }
         user.password=password;

         user.forgetPasswordToken=undefined;

         user.forgetPasswordExpiry=undefined;

         user.save();

         res.status(200).json({
            success:true,
            message:"Password changed successfully!"
         })

}
const changePassword= async(req,res)=>{
    const { oldPassword, newPassword}=req.body;
    const{id}=req.user;

    if(!oldPassword || !newPassword)
    {
        return next(new AppError("Please provide both old and new password",400));
    }
    const user= await User.findById(id).select('+password');
    
    if(!user)
    {
        return next(new AppError("User does't exist",404));
    }

    const isPasswordValid= await user.comparePassword(oldPassword);

    if(!isPasswordValid)
    {
        return next(new AppError("Password mismatched ",400))
    }
    user.password=newPassword;

    await user.save();

    user.password=undefined;

    res.status(200).json({
        success:true,
        message:"Password changed successfully!"
    });
}

const updateUser=async(req,res)=>{
    const {fullName}=req.body;
    const {id}=req.params;

    const user= await User.findById(id);

    if(!user)
    {
        return next(new AppError("User doesn't exist",400))
    }

    if(req.fullName)
    {
        user.fullName=fullName;
    }

    if(req.file)
    {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
          result = await cloudinary.uploader.upload(req.file.path, {
            folder: "lms",
            width: 250,
            height: 250,
            gravity: "faces",
            crop: "fill",
          });
          console.log(user);
          console.log(result);

          if(result)
          {
            fs.rm(`uploads/${req.file.filename}`);
          }

          // if(result)
          // {
          //     // user.avatar.public_id=result.public_id;
          //     // user.avatar.secure_url=result.secure_url;

          //     //remove file from server
          //     // console.log(`uploads/${req.file.filename}`);
          //     // fs.rm(`uploads/${req.file.filename}`);
          //     // return result.secure_url;
          //     // user.secure_url=result.secure_url

          // }
        } catch (e) {
          return next(
            new AppError(e.message || "Failed to upload avatar", 400)
          );
        }
    }
    await user.save();

    res.status(200).json({
        status: 'success',
        message: "User details updated successfully"
    });
}

export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};