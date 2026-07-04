import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL,
  NVIDIA_ANALYSIS_MODEL: process.env.NVIDIA_ANALYSIS_MODEL,
  NVIDIA_REWRITE_MODEL: process.env.NVIDIA_REWRITE_MODEL,
  NVIDIA_REVIEW_MODEL: process.env.NVIDIA_REVIEW_MODEL,
  NVIDIA_GENERATE_MODEL: process.env.NVIDIA_GENERATE_MODEL,
  NVIDIA_MODEL_OVERRIDE: process.env.NVIDIA_MODEL_OVERRIDE,
  aiProvider: process.env.AI_PROVIDER || 'openrouter',
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  OPENROUTER_ANALYSIS_MODEL: process.env.OPENROUTER_ANALYSIS_MODEL,
  OPENROUTER_REWRITE_MODEL: process.env.OPENROUTER_REWRITE_MODEL,
  OPENROUTER_REVIEW_MODEL: process.env.OPENROUTER_REVIEW_MODEL,
  OPENROUTER_GENERATE_MODEL: process.env.OPENROUTER_GENERATE_MODEL,
  OPENROUTER_MODEL_OVERRIDE: process.env.OPENROUTER_MODEL_OVERRIDE,
  geminiApiKey: process.env.GEMINI_API_KEY,
};
