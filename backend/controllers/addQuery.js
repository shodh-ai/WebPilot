import supabase from '../config/supabase.js';

export async function addQuery(req, res) {
  const { text, department, email } = req.body;

  const user_id = req.user.userId; 

  console.log("Query submitted by user : ",user_id);

  const { data: queryData, error: queryError } = await supabase
    .from('Query')
    .insert({ text, department, user_mail: email })
    .select();

  if (queryError) {
    res.status(500).json({ error: queryError.message });
    return;
  }
  console.log(queryData[0]);

  const { data: queryUserData, error: queryUserError } = await supabase
    .from('query-user')
    .insert({ user: user_id, query: queryData[0].query_id });

  if (queryUserError) {
    res.status(500).json({ error: queryUserError.message });
  } else {
    res.status(200).json({ message: 'Query added successfully' });
  }
}
