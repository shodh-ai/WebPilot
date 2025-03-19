const { supabase } = require('../config/supabase');
const { getMessagesSchema } = require('../schemas/getMessagesSchema');

exports.getMessages = async (req, res) => {
  try {
    const parsed = getMessagesSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("Backend: Validation errors:", parsed.error.issues);
      return res.status(400).json({ errors: parsed.error.issues });
    }
    const { user_id } = parsed.data;
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', user_id)
      .single();
    if (userError || !userData) {
      console.log("Backend: User not found for user_id", user_id);
      return res.status(404).json({ error: 'User not found.' });
    }
    const { data, error } = await supabase
      .from('message-user')
      .select(`
        id,
        created_at,
        sender,
        reciver,
        message (
          message_id,
          message,
          seen,
          created_at
        )
      `)
      .or(`sender.eq.${user_id},reciver.eq.${user_id}`)
      .order('created_at', { ascending: false });
    if (error) {
      console.log("Backend: Error retrieving messages:", error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log("Backend: Retrieved messages:", data);
    return res.status(200).json({ messages: data });
  } catch (err) {
    console.error("Backend: Internal Server Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
