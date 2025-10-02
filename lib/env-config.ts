// Simple environment configuration for translation app
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DASHSCOPE_API_KEY",
    description: "Alibaba Cloud DashScope API key for Qwen model access",
    required: true,
    instructions: "Go to [Alibaba Cloud Console](https://bailian.console.aliyun.com/) → Model Studio → Create API Key.\nCopy the generated API key that starts with 'sk-'.\nThis is required for translation functionality."
  }
];

// SUPABASE/DATABASE VARIABLES (uncomment and add to ENV_VARIABLES array when adding database features)
// {
//   name: "DATABASE_URL",
//   description: "Supabase PostgreSQL database connection string for migrations and server-side operations",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Database → Connection string (URI format).\n Copy the full postgresql:// connection string.\n Make sure to replace [YOUR-PASSWORD] with actual password"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_URL",
//   description: "Supabase project URL for client-side authentication and API calls",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Data API → Copy the 'Project URL -> URL' field (format: https://[project-id].supabase.co)"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
//   description: "Supabase anonymous/publishable key for client-side authentication",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API Keys → Copy 'Legacy API keys → anon public' key"
// }

export interface EnvVariable {
  name: string
  description: string
  instructions: string
  required: boolean
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(envVar => envVar.required && !process.env[envVar.name]).map(envVar => envVar.name)
}