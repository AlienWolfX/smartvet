<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiConfiguration extends Model
{
    protected $fillable = [
        'key',
        'provider',
        'model',
        'api_key',
        'api_endpoint',
        'temperature',
        'max_tokens',
        'system_prompt',
        'category_rules',
        'enabled',
        'features',
    ];

    protected $casts = [
        'temperature' => 'float',
        'max_tokens' => 'integer',
        'enabled' => 'boolean',
        'features' => 'array',
    ];

    /**
     * Get the default AI configuration
     */
    public static function getDefault(): ?self
    {
        return static::where('key', 'default')->first();
    }

    /**
     * Get or create default configuration
     */
    public static function getOrCreateDefault(): self
    {
        $config = static::getDefault();

        if (!$config) {
            $config = static::create([
                'key' => 'default',
                'provider' => 'local',
                'model' => 'qwen3:4b',
                'api_endpoint' => 'http://localhost:11434',
                'temperature' => 0.7,
                'max_tokens' => 1000,
                'system_prompt' => static::getDefaultSystemPrompt(),
                'category_rules' => static::getDefaultCategoryRules(),
                'enabled' => true,
                'features' => [
                    'chatbot' => true,
                    'diagnosticAssistance' => false,
                    'reportGeneration' => true,
                    'inventoryPrediction' => true,
                ],
            ]);
        }

        return $config;
    }

    /**
     * Get the default system prompt
     */
    public static function getDefaultSystemPrompt(): string
    {
        return <<<'PROMPT'
You are SmartVet AI Assistant. You have access to the clinic's database. Answer questions accurately and concisely using ONLY the data provided below.

CRITICAL RULES:
1. ONLY answer what the user asks - do not add recommendations, suggestions, or extra commentary
2. Be brief and direct - just provide the facts
3. Use the exact data from the context below - do not make assumptions
4. If data is not available, simply say "I don't have that information"
5. Use Philippine Peso (₱) for currency

{{CATEGORY_RULES}}

{{INVENTORY_DATA}}

{{PET_STATISTICS}}

{{FINANCIAL_SUMMARY}}

{{LOW_STOCK_ALERTS}}

{{UPCOMING_VACCINATIONS}}
PROMPT;
    }

    /**
     * Get default category rules
     */
    public static function getDefaultCategoryRules(): string
    {
        return <<<'RULES'
INVENTORY CATEGORY RULES (VERY IMPORTANT):
- When asked about "vaccines" or "vaccinations", ONLY list items from the "Vaccination" category
- When asked about "medications" or "medicines", ONLY list items from the "Medications" category
- When asked about "food" or "pet food", ONLY list items from the "Food" category
- When asked about "supplies", ONLY list items from the "Supplies" category
- Amoxicillin, Metronidazole, and similar antibiotics are MEDICATIONS, not vaccines
- DHPP, Rabies, Bordetella, and similar immunization shots are VACCINES from the "Vaccination" category
- NEVER mix categories - only show items from the requested category
- When listing inventory, always group by category and clearly label each category
RULES;
    }

    /**
     * Get the full system prompt with dynamic data
     */
    public function getFullSystemPrompt(array $contextData): string
    {
        $prompt = $this->system_prompt;
        $categoryRules = $this->category_rules ?? static::getDefaultCategoryRules();

        // Replace placeholders
        $prompt = str_replace('{{CATEGORY_RULES}}', $categoryRules, $prompt);
        $prompt = str_replace('{{INVENTORY_DATA}}', $contextData['inventory_data'] ?? '', $prompt);
        $prompt = str_replace('{{PET_STATISTICS}}', $contextData['pet_statistics'] ?? '', $prompt);
        $prompt = str_replace('{{OWNERS_AND_PETS}}', $contextData['owners_and_pets'] ?? '', $prompt);
        $prompt = str_replace('{{FINANCIAL_SUMMARY}}', $contextData['financial_summary'] ?? '', $prompt);
        $prompt = str_replace('{{LOW_STOCK_ALERTS}}', $contextData['low_stock_alerts'] ?? '', $prompt);
        $prompt = str_replace('{{UPCOMING_VACCINATIONS}}', $contextData['upcoming_vaccinations'] ?? '', $prompt);

        // Append owners/pets data if no placeholder was used
        if (!str_contains($this->system_prompt, '{{OWNERS_AND_PETS}}') && !empty($contextData['owners_and_pets'])) {
            $prompt .= "\n\n" . $contextData['owners_and_pets'];
        }

        return $prompt;
    }
}
