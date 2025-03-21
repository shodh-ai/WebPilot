import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { sendMessageSchema } from '../schemas/sendMessageSchema.js';

export async function sendMessage(req, res) {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.issues });
    }
    const { receiver_id, content } = parsed.data;
    const sender_id = req.user.userId;

    const { data: senderData, error: senderError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', sender_id)
      .single();

    if (senderError || !senderData) {
      return res.status(404).json({ error: 'Sender not found.' });
    }

    const { data: receiverData, error: receiverError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', receiver_id)
      .single();

    if (receiverError || !receiverData) {
      return res.status(404).json({ error: 'Receiver not found.' });
    }

    const newMessageId = uuidv4();
    const { data: messageData, error: messageError } = await supabase
      .from('Message')
      .insert({
        message_id: newMessageId,
        message: content,
        seen: false,
      })
      .select()
      .single();

    if (messageError) {
      return res.status(500).json({ error: messageError.message });
    }

    const { data: messageUserData, error: messageUserError } = await supabase
      .from('message-user')
      .insert({
        sender: sender_id,
        reciver: receiver_id,
        message: newMessageId,
      })
      .select()
      .single();

    if (messageUserError) {
      return res.status(500).json({ error: messageUserError.message });
    }

    return res.status(200).json({
      message: 'Message sent successfully',
      messageData,
      messageUserData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
