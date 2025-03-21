import supabase from '../config/supabase.js';

export async function getPosts(req, res) {
  const { data, error } = await supabase
    .from('Posts')
    .select('Title, Content, created_at')
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    console.log(data);
    res.json(data);
  }
}
