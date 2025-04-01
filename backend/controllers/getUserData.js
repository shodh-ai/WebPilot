import supabase from "../config/supabase.js";

export async function getUserData(req,res){
    const user_id = req.user.userId;
    const {data,error} = await supabase
    .from('User')
    .select('mail,created_at')
    .eq('user_id',user_id)
    .single();
    if(error){
        return res.status(500).json({error:error.message})
    }
    return res.status(200).json({data:data})
}