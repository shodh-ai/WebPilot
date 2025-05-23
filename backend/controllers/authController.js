import supabase from '../config/supabase.js';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { hash, compare } from 'bcryptjs';

export async function signup(req, res) {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('mail')
      .eq('mail', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Generate a UUID for user_id
    const user_id = crypto.randomUUID();

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert({
        mail: email,
        pass: hashedPassword,
        user_id,
        created_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Generate JWT token
    const token = sign(
      { userId: user_id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        email,
        user_id
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Something went wrong during signup' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('mail', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await compare(password, user.pass);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = sign(
      { userId: user.user_id, email: user.mail },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        email: user.mail,
        user_id: user.user_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Something went wrong during login' });
  }
}

export const verifyToken = (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
