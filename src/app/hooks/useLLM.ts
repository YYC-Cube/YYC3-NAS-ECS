import { useState } from 'react';

export const useLLM = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateConfig = async (_currentConfig: string, _prompt: string): Promise<string> => {
    setIsGenerating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);

    // Mock AI response for FRP config
    const optimizedConfig = `
# Optimized FRP Configuration by AI
[common]
server_addr = "x.x.x.x"
server_port = 7000

# Improved Security Settings
token = "secure_token_generated_by_ai_8f7d9a"
tls_enable = true
use_encryption = true
use_compression = true

# SSH Service
[ssh]
type = "tcp"
localCXip = "127.0.0.1"
local_port = 22
remote_port = 6000
bandwidth_limit = "1MB"

# Web Service
[web]
type = "http"
local_port = 80
custom_domains = "www.example.com"
locations = ["/"]
http_user = "admin"
http_pwd = "password123"
    `.trim();

    return optimizedConfig;
  };

  const analyzeLog = async (logEntry: string): Promise<string> => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    return `[AI Analysis]: The error "${logEntry.substring(0, 30)}..." suggests a connection timeout. Recommended action: Check firewall settings and ensure the target service port is open.`;
  };

  const generateResponse = async (prompt: string): Promise<string> => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    return `[AI Response]: Analysis complete for "${prompt.substring(0, 50)}..."`;
  };

  return { generateConfig, analyzeLog, generateResponse, isGenerating };
};
