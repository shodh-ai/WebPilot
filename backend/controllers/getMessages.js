import supabase from '../config/supabase.js';

export async function getMessages(req, res) {
  try {
    const user_id = req.user.userId;
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
      .order('created_at', { ascending: true });

    if (error) {
      console.log("Backend: Error retrieving messages:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Format each message so that the message text is nested
    const formattedMessages = data.map(({ id, sender, reciver, created_at, message }) => ({
      id,
      sender,
      reciver,
      created_at,
      message: { message: message.message },
      seen: message.seen,
      message_id: message.message_id,
      message_created_at: message.created_at,
    }));

    formattedMessages.forEach(message => {
      console.log("Backend: Retrieved message ID:", message.id);
    });
    return res.status(200).json({ messages: formattedMessages });
  } catch (err) {
    console.error("Backend: Internal Server Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
