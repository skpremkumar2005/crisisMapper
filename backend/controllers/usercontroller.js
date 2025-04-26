const {User} =require( "../models/User");
const {Response} =require(  "../models/Response");

const resquestasked=async(req,res)=>{
    try{
        console.log(1)
        const user=await User.findById(req.user.id);
        if(!user)return res.status(400).json("user not found");
        const help=await Response.find({ civilianRequester:user._id })
        // const h=help.civilianRequester.include(user._id);
        console.log(help)
        return help;
    }
    catch(e){
        res.status(500).json("server error");
    }

}

module.exports= resquestasked; 