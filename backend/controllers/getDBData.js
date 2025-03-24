import supabase from '../config/supabase.js';

export async function getDBData(req, res) {
  let { tables } = req.body;
  tables = 'user-message (sender,message)'
  tables = 'user_id, \n' + tables;
  console.log(tables);
  const { data: tableData, error: tableError } = await supabase
    .from('User')
    .select(tables);
  //   .from('User')
  //   .select('User.user_id, user-messages.message, Messages.content')
  //   .naturalJoin('user-messages')
  //   .naturalJoin('Messages')
  //   .eq('User.mail', req.body.email)
  //   .single();

  if (tableError) {
    return res.status(400).json({ error: tableError.message });
  }
  return res.json({ message: 'Data fetched successfully', data: tableData });
}
