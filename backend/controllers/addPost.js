const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');
const { addPostSchema } = require('../schemas/addPostSchema');

exports.addPost = async (req, res) => {
  try {
    const parsed = addPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.issues });
    }

    const { title, content } = parsed.data;
    const user_id = req.user.userId; 

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newPostId = uuidv4();
    const { data: postData, error: postError } = await supabase
      .from('Posts')
      .insert({
        post_id: newPostId,
        Title: title,
        Content: content,
      })
      .select()
      .single();

    if (postError) {
      return res.status(500).json({ error: postError.message });
    }

    const { data: postUserData, error: postUserError } = await supabase
      .from('post-user')
      .insert({
        post: newPostId,
        user: userData.user_id,
      })
      .select()
      .single();

    if (postUserError) {
      return res.status(500).json({ error: postUserError.message });
    }

    return res.status(200).json({
      message: 'Post added successfully',
      post: postData,
      postUser: postUserData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
