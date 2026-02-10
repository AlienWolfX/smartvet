<?php

namespace Database\Seeders;

use App\Models\AiConfiguration;
use Illuminate\Database\Seeder;

class AiConfigurationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AiConfiguration::updateOrCreate(
            ['key' => 'default'],
            [
                'provider' => 'local',
                'model' => 'qwen3:4b',
                'api_endpoint' => 'http://localhost:11434',
                'temperature' => 0.7,
                'max_tokens' => 1000,
                'system_prompt' => AiConfiguration::getDefaultSystemPrompt(),
                'category_rules' => AiConfiguration::getDefaultCategoryRules(),
                'enabled' => true,
                'features' => [
                    'chatbot' => true,
                    'diagnosticAssistance' => false,
                    'reportGeneration' => true,
                    'inventoryPrediction' => true,
                ],
            ]
        );
    }
}
