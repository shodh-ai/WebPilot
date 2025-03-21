import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';

export async function getLiveMessage(req, res) {
  try {
    console.log('Starting live message stream...');

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      console.log('Sending heartbeat...');
      res.write(': heartbeat\n\n');
    }, 15000);

    const userId = req.user.userId;
    if (!userId) {
      console.log('User not authenticated');
      res.write(`data: ${JSON.stringify({ error: "User not authenticated" })}\n\n`);
      clearInterval(heartbeat);
      return res.end();
    }

    console.log(`User authenticated with userId: ${userId}`);

    const channel = supabase.channel(`live-messages-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message-user',
        filter: `reciver=eq.${userId}`
      }, async (payload) => {
        console.log('Received payload:', payload);

        const newMsgUser = payload.new;
        console.log('New message user entry:', newMsgUser);

        const { data: messageRecord, error } = await supabase
          .from('Message')
          .select(`
            message_id,
            message,
            seen,
            created_at
          `)
          .eq('message_id', newMsgUser.message)
          .single();

        if (error) {
          console.error("Error fetching message:", error);
          res.write(`data: ${JSON.stringify({ error: "Error fetching message details" })}\n\n`);
        } else {
          console.log('Fetched message details:', messageRecord);

          const combinedData = {
            id: newMsgUser.id,
            created_at: newMsgUser.created_at,
            sender: newMsgUser.sender,
            reciver: newMsgUser.reciver,
            message: {
              message_id: messageRecord.message_id,
              message: messageRecord.message,
              seen: messageRecord.seen,
              created_at: messageRecord.created_at,
            },
          };
          console.log('Sending combined message data:', combinedData);
          res.write(`data: ${JSON.stringify(combinedData)}\n\n`);
        }
      })
      .subscribe();

    req.on('close', () => {
      console.log('Client connection closed.');
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
      res.end();
    });

  } catch (err) {
    console.error("Internal server error:", err);
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
    }
    res.end();
  }
}
