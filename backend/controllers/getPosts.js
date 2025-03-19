const { supabase } = require('../config/supabase');

exports.getPosts = async (req, res) => {
  const { data, error } = await supabase
    .from('Posts')
    .select('Title, Content')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    console.log(data);
    res.json(data);
  }
};
