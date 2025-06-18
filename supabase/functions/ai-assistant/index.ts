
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, type, context } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    let prompt = ''
    let suggestion_type = ''

    switch (type) {
      case 'clipboard_analysis':
        prompt = `Analyze this clipboard content and provide smart suggestions for actions or categorization: "${content}". Return JSON with: {"category": "text|url|email|phone|address|code|other", "actions": ["action1", "action2"], "summary": "brief description"}`
        suggestion_type = 'clipboard_analysis'
        break
      
      case 'file_organization':
        prompt = `Suggest optimal organization for this file: "${content}". Consider file type, name, and context: ${JSON.stringify(context)}. Return JSON with: {"category": "documents|media|code|archive|other", "suggested_folder": "folder_name", "tags": ["tag1", "tag2"], "auto_actions": ["action1", "action2"]}`
        suggestion_type = 'file_organization'
        break
      
      case 'device_recommendation':
        prompt = `Based on this task context: "${content}" and available devices: ${JSON.stringify(context.devices)}, recommend the best device. Return JSON with: {"recommended_device": "device_id", "reason": "explanation", "confidence": 0.9, "alternative": "device_id"}`
        suggestion_type = 'device_recommendation'
        break
      
      default:
        throw new Error('Invalid AI request type')
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for UniLink, a cross-device productivity app. Provide helpful, concise suggestions in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed')
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // Parse AI response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (e) {
      parsedResponse = { suggestion: aiResponse, raw: true }
    }

    // Calculate confidence score
    const confidence_score = parsedResponse.confidence || 0.8

    // Store suggestion in database
    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .insert({
        user_id: user.id,
        suggestion_type,
        content: parsedResponse,
        confidence_score
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestion: parsedResponse,
        suggestion_id: suggestion?.id,
        confidence_score 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Assistant error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
