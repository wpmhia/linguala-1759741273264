// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DASHSCOPE_API_KEY",
    description: "Alibaba Cloud DashScope API key for Qwen model access",
    required: true,
    instructions: "Go to [Alibaba Cloud Console](https://bailian.console.aliyun.com/) → Model Studio → Create API Key.\nCopy the generated API key that starts with 'sk-'.\nThis is required for translation functionality."
  },
  {
    name: "DATABASE_URL",
    description: "Neon PostgreSQL database connection string for Prisma operations",
    required: true,
    instructions: "Go to [Neon Console](https://console.neon.tech/) → Your Project → Dashboard → Connection Details.\nCopy the 'Database URL' connection string (postgresql://...).\nThis is required for user authentication and data persistence."
  },
  {
    name: "DIRECT_URL",
    description: "Neon direct database connection for migrations (optional but recommended)",
    required: false,
    instructions: "Go to [Neon Console](https://console.neon.tech/) → Your Project → Dashboard → Connection Details.\nCopy the 'Direct connection' URL if available.\nThis improves migration performance."
  },
  {
    name: "NEXTAUTH_SECRET",
    description: "NextAuth.js secret for JWT encryption and session security",
    required: true,
    instructions: "Generate a random secret key using: openssl rand -base64 32\nOr visit [generate-secret.vercel.app](https://generate-secret.vercel.app/32)\nThis secures user sessions and authentication tokens."
  },
  {
    name: "NEXTAUTH_URL",
    description: "Full URL where your Next.js app is deployed (for Auth.js callbacks)",
    required: false,
    instructions: "Set to your domain in production (e.g., https://yourdomain.com).\nFor development, this defaults to http://localhost:3000.\nRequired for OAuth providers and proper redirect handling."
  },
  {
    name: "GOOGLE_CLIENT_ID",
    description: "Google OAuth client ID for Google Sign-In integration",
    required: false,
    instructions: "Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID.\nSet authorized redirect URIs to: http://localhost:3000/api/auth/callback/google (dev) and https://yourdomain.com/api/auth/callback/google (prod).\nCopy the generated Client ID."
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret for Google Sign-In integration",
    required: false,
    instructions: "From the same Google Cloud Console OAuth 2.0 Client configuration.\nCopy the generated Client Secret.\nKeep this secret secure and never expose it publicly."
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