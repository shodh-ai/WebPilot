import supabase from '../config/supabase.js';

export async function getDBData(req, res) {
  let { tables } = req.body;
  tables = 'user_id, messages:message-user!sender(message(message_id, message, seen, created_at))'
  console.log(tables);
  const { data: tableData, error: tableError } = await supabase
    .from('User')
    .select(tables);

  if (tableError) {
    return res.status(400).json({ error: tableError.message });
  }
  return res.json({ message: 'Data fetched successfully', data: tableData });
}
