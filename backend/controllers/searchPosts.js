const { supabase } = require('../config/supabase');

const searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const { data, error } = await supabase
      .from('Posts')
      .select('*')
      .or(`Title.ilike.%${query}%,Content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error searching posts:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { searchPosts };