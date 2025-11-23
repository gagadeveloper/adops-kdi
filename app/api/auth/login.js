// pages/api/auth/login.js
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { email, password } = req.body
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return res.status(200).json(data)
  } catch (error) {
    console.error('Login error:', error)
    return res.status(400).json({ error: error.message })
  }
}