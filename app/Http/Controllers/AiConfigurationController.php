<?php

namespace App\Http\Controllers;

use App\Models\AiConfiguration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AiConfigurationController extends Controller
{
    /**
     * Get the AI configuration
     */
    public function show()
    {
        $config = AiConfiguration::getOrCreateDefault();
        
        return response()->json([
            'success' => true,
            'config' => [
                'id' => $config->id,
                'key' => $config->key,
                'provider' => $config->provider,
                'model' => $config->model,
                'api_key' => $config->api_key ? '***' : null, // Mask API key
                'api_endpoint' => $config->api_endpoint,
                'temperature' => $config->temperature,
                'max_tokens' => $config->max_tokens,
                'system_prompt' => $config->system_prompt,
                'category_rules' => $config->category_rules,
                'enabled' => $config->enabled,
                'features' => $config->features,
            ],
        ]);
    }

    /**
     * Update the AI configuration
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'sometimes|string|in:openai,anthropic,google,local',
            'model' => 'sometimes|string|max:100',
            'api_key' => 'nullable|string|max:500',
            'api_endpoint' => 'nullable|string|max:500',
            'temperature' => 'sometimes|numeric|min:0|max:1',
            'max_tokens' => 'sometimes|integer|min:100|max:10000',
            'system_prompt' => 'sometimes|string',
            'category_rules' => 'nullable|string',
            'enabled' => 'sometimes|boolean',
            'features' => 'sometimes|array',
        ]);

        $config = AiConfiguration::getOrCreateDefault();

        // Don't update API key if it's masked
        if (isset($validated['api_key']) && $validated['api_key'] === '***') {
            unset($validated['api_key']);
        }

        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'AI configuration updated successfully',
            'config' => [
                'id' => $config->id,
                'key' => $config->key,
                'provider' => $config->provider,
                'model' => $config->model,
                'api_key' => $config->api_key ? '***' : null,
                'api_endpoint' => $config->api_endpoint,
                'temperature' => $config->temperature,
                'max_tokens' => $config->max_tokens,
                'system_prompt' => $config->system_prompt,
                'category_rules' => $config->category_rules,
                'enabled' => $config->enabled,
                'features' => $config->features,
            ],
        ]);
    }

    /**
     * Reset to default configuration
     */
    public function reset()
    {
        $config = AiConfiguration::getOrCreateDefault();
        
        $config->update([
            'system_prompt' => AiConfiguration::getDefaultSystemPrompt(),
            'category_rules' => AiConfiguration::getDefaultCategoryRules(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'AI configuration reset to defaults',
            'config' => [
                'system_prompt' => $config->system_prompt,
                'category_rules' => $config->category_rules,
            ],
        ]);
    }

    /**
     * Get available models for a provider
     */
    public function getModels(Request $request)
    {
        $provider = $request->input('provider', 'local');
        
        $models = match($provider) {
            'openai' => ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
            'anthropic' => ['claude-3-sonnet', 'claude-3-haiku', 'claude-2'],
            'google' => ['gemini-pro', 'gemini-pro-vision'],
            'local' => ['qwen3:4b', 'qwen2:7b', 'sailor2:1b', 'gpt-oss:20b', 'llama2', 'mistral'],
            default => [],
        };

        return response()->json([
            'success' => true,
            'models' => $models,
        ]);
    }
}
