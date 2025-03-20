const { supabase } = require('../config/supabase');

exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('mail, user_id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
