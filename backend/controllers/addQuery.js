const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

exports.addQuery = async (req, res) => {
  const { text, department, auth_token } = req.body;
  // const decoded = jwt.verify(auth_token, process.env.JWT_TOKEN);
  // const user_id = decoded.user_id;
  const user_id = "b864a841-0b56-41a1-8aa5-3a92dc747953";

  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('mail')
    .eq('user_id', user_id)
    .single();

  if (userError) {
    res.status(500).json({ error: userError.message });
    return;
  }
  console.log(userData)

  const { data: queryData, error: queryError } = await supabase
    .from('Query')
    .insert({ text, department, user_mail: userData.mail })
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
};
