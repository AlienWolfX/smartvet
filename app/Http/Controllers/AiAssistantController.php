<?php

namespace App\Http\Controllers;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Services\AiAssistantService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiAssistantController extends Controller
{
    protected AiAssistantService $aiService;

    public function __construct(AiAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Handle chat messages and return AI response
     */
    public function chat(Request $request)
    {
        // Increase PHP execution time for AI responses
        set_time_limit(180);
        
        $request->validate([
            'message' => 'required|string|max:2000',
            'model' => 'nullable|string',
            'conversation_history' => 'nullable|array',
        ]);

        $userMessage = $request->input('message');
        $model = $request->input('model', 'qwen3:4b');
        $conversationHistory = $request->input('conversation_history', []);

        try {
            // Build context-aware system prompt
            $systemPrompt = $this->aiService->buildSystemPrompt();

            // Check if user is asking about specific data
            $additionalContext = $this->getAdditionalContext($userMessage);
            if ($additionalContext) {
                $systemPrompt .= "\n\n## SEARCH RESULTS FOR USER QUERY:\n" . $additionalContext;
            }

            // Build messages array for Ollama
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
            ];

            // Add conversation history
            foreach ($conversationHistory as $msg) {
                $messages[] = [
                    'role' => $msg['type'] === 'user' ? 'user' : 'assistant',
                    'content' => $msg['content'],
                ];
            }

            // Add current user message
            $messages[] = ['role' => 'user', 'content' => $userMessage];

            // Call Ollama API with extended timeout
            $response = Http::timeout(180)->post('http://localhost:11434/api/chat', [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
                'options' => [
                    'temperature' => 0.7,
                    'top_p' => 0.9,
                    'num_predict' => 2048,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $assistantMessage = $data['message']['content'] ?? 'I apologize, but I couldn\'t generate a response.';

                return response()->json([
                    'success' => true,
                    'message' => $assistantMessage,
                    'model' => $model,
                ]);
            }

            Log::error('Ollama API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get response from AI model. Please ensure Ollama is running.',
                'error' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            Log::error('AI Assistant error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request. Please ensure Ollama is running on localhost:11434.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get additional context based on user query
     */
    private function getAdditionalContext(string $message): ?string
    {
        $context = [];
        $lowerMessage = strtolower($message);

        // Check for pet-related queries - match natural language patterns
        $petPatterns = [
            '/(?:find|search|show|get|look\s*up|lookup)\s+(?:pet|animal|dog|cat|bird)?\s*(?:named?|called?)?\s*["\']?(\w+)["\']?/i',
            '/(?:what|which)\s+(?:pet|animal|dog|cat)s?\s+(?:does|do|did|is|are|belong|owned)\s+(.+?)(?:\s+(?:have|own|got))?\??$/i',
            '/(?:pet|animal|dog|cat)s?\s+(?:of|for|owned by|belonging to)\s+(.+?)\??$/i',
            '/(.+?)(?:\'s|s\')\s+(?:pet|animal|dog|cat)s?/i',
        ];

        foreach ($petPatterns as $pattern) {
            if (preg_match($pattern, $message, $matches)) {
                $searchTerm = trim($matches[1], "\"' ");
                $pets = $this->aiService->searchPets($searchTerm);
                if (!empty($pets)) {
                    $context[] = "### Pet Search Results for '{$searchTerm}':\n" . $this->formatPetResults($pets);
                    break;
                }
            }
        }

        // If no specific pet match found, try matching any capitalized names in the message against owners/pets
        if (empty($context) && preg_match_all('/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/', $message, $nameMatches)) {
            foreach ($nameMatches[0] as $possibleName) {
                if (strlen($possibleName) > 2 && !in_array(strtolower($possibleName), ['the', 'what', 'which', 'how', 'who', 'please', 'can', 'could', 'would', 'does', 'this', 'that'])) {
                    $pets = $this->aiService->searchPets($possibleName);
                    if (!empty($pets)) {
                        $context[] = "### Pet Search Results for '{$possibleName}':\n" . $this->formatPetResults($pets);
                        break;
                    }
                }
            }
        }

        // Check for inventory-related queries
        if (preg_match('/(?:find|search|show|get|check|look\s*up|lookup)\s+(?:inventory|stock|item|medicine|vaccine|supply)?\s*(?:named?|called?)?\s*["\']?(\w+)["\']?/i', $message, $matches)) {
            $searchTerm = $matches[1];
            $items = $this->aiService->searchInventory($searchTerm);
            if (!empty($items)) {
                $context[] = "### Inventory Search Results for '{$searchTerm}':\n" . $this->formatInventoryResults($items);
            }
        }

        // General inventory questions
        if (str_contains($lowerMessage, 'inventory') || str_contains($lowerMessage, 'stock') || str_contains($lowerMessage, 'low stock') || str_contains($lowerMessage, 'out of stock')) {
            $lowStock = $this->aiService->getLowStockItems();
            if (!empty($lowStock)) {
                $context[] = "### Current Low/Out of Stock Items:\n" . $this->formatInventoryResults($lowStock);
            }
        }

        // Vaccination queries
        if (str_contains($lowerMessage, 'vaccination') || str_contains($lowerMessage, 'vaccine') || str_contains($lowerMessage, 'due')) {
            $vaccinations = $this->aiService->getUpcomingVaccinations();
            if (!empty($vaccinations)) {
                $context[] = "### Upcoming Vaccinations:\n" . $this->formatVaccinationResults($vaccinations);
            }
        }

        return !empty($context) ? implode("\n\n", $context) : null;
    }

    private function formatPetResults(array $pets): string
    {
        return collect($pets)->map(function ($pet) {
            return "- **{$pet['name']}** ({$pet['species']} - {$pet['breed']})\n" .
                   "  Owner: {$pet['owner_name']} | Phone: {$pet['owner_phone']}\n" .
                   "  Age: {$pet['age']} | Gender: {$pet['gender']} | Status: {$pet['status']}\n" .
                   "  Last Visit: {$pet['last_visit']}";
        })->join("\n\n");
    }

    private function formatInventoryResults(array $items): string
    {
        return collect($items)->map(function ($item) {
            if (isset($item['item_code'])) {
                return "- **{$item['name']}** [{$item['item_code']}]\n" .
                       "  Category: {$item['category']} | Brand: {$item['brand']}\n" .
                       "  Stock: {$item['current_stock']}/{$item['min_stock']} | Price: ₱{$item['unit_price']}\n" .
                       "  Status: {$item['status']}";
            }
            return "- **{$item['name']}** ({$item['category']})\n" .
                   "  Stock: {$item['current_stock']}/{$item['min_stock']} - {$item['status']}";
        })->join("\n\n");
    }

    private function formatVaccinationResults(array $vaccinations): string
    {
        return collect($vaccinations)->map(function ($vax) {
            $status = $vax['is_overdue'] ? '🔴 OVERDUE' : '🟡 Due Soon';
            return "- **{$vax['pet_name']}** (Owner: {$vax['owner_name']})\n" .
                   "  Vaccine: {$vax['vaccine_name']}\n" .
                   "  Due Date: {$vax['due_date']} - {$status}";
        })->join("\n\n");
    }

    /**
     * Test connection to Ollama
     */
    public function testConnection(Request $request)
    {
        $model = $request->input('model', 'qwen3:4b');

        try {
            // Just check if Ollama is running by fetching models list (fast)
            $response = Http::timeout(5)->get('http://localhost:11434/api/tags');

            if ($response->successful()) {
                $data = $response->json();
                $models = collect($data['models'] ?? []);
                $hasModel = $models->contains(fn($m) => $m['name'] === $model);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Successfully connected to Ollama!',
                    'model' => $model,
                    'model_available' => $hasModel,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to Ollama',
                'error' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot connect to Ollama. Please ensure it is running.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available models from Ollama
     */
    public function getModels()
    {
        try {
            $response = Http::timeout(10)->get('http://localhost:11434/api/tags');

            if ($response->successful()) {
                $data = $response->json();
                $models = collect($data['models'] ?? [])->map(fn($m) => [
                    'name' => $m['name'],
                    'size' => $this->formatBytes($m['size'] ?? 0),
                    'modified' => $m['modified_at'] ?? null,
                ])->toArray();

                return response()->json([
                    'success' => true,
                    'models' => $models,
                ]);
            }

            return response()->json([
                'success' => false,
                'models' => [],
                'error' => 'Failed to fetch models',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'models' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 1) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }
        return number_format($bytes / 1024, 1) . ' KB';
    }

    /**
     * Get database context summary
     */
    public function getContext()
    {
        return response()->json([
            'success' => true,
            'context' => $this->aiService->getDatabaseContext(),
        ]);
    }

    /**
     * Search pets endpoint
     */
    public function searchPets(Request $request)
    {
        $request->validate(['query' => 'required|string|max:100']);
        
        $results = $this->aiService->searchPets($request->input('query'));
        
        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    /**
     * Search inventory endpoint
     */
    public function searchInventory(Request $request)
    {
        $request->validate(['query' => 'required|string|max:100']);
        
        $results = $this->aiService->searchInventory($request->input('query'));
        
        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    /**
     * Get pet details endpoint
     */
    public function getPetDetails(int $petId)
    {
        $details = $this->aiService->getPetDetails($petId);
        
        if (!$details) {
            return response()->json([
                'success' => false,
                'message' => 'Pet not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'pet' => $details,
        ]);
    }

    /**
     * Get all conversations for the current user
     */
    public function getConversations()
    {
        $conversations = AiConversation::where('user_id', auth()->id())
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'model' => $c->model,
                'message_count' => $c->messages_count,
                'last_message_at' => $c->last_message_at?->format('M d, Y h:i A'),
                'created_at' => $c->created_at->format('M d, Y h:i A'),
            ]);

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get a single conversation with messages
     */
    public function getConversation(int $id)
    {
        $conversation = AiConversation::where('user_id', auth()->id())
            ->with(['messages' => fn($q) => $q->orderBy('created_at')])
            ->find($id);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'model' => $conversation->model,
                'created_at' => $conversation->created_at->format('M d, Y h:i A'),
                'messages' => $conversation->messages->map(fn($m) => [
                    'id' => (string) $m->id,
                    'type' => $m->role,
                    'content' => $m->content,
                    'context' => $m->context,
                    'timestamp' => $m->created_at->toISOString(),
                ]),
            ],
        ]);
    }

    /**
     * Create a new conversation
     */
    public function createConversation(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'model' => 'nullable|string',
        ]);

        $conversation = AiConversation::create([
            'user_id' => auth()->id(),
            'title' => $request->input('title', 'New Conversation'),
            'model' => $request->input('model', 'qwen3:4b'),
        ]);

        // Add greeting message
        $greetingMessage = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => "Hello! I'm your SmartVet AI Assistant powered by local AI models. I have direct access to your clinic's database and can help you with:\n\n• **Inventory Management** - Check stock levels, low stock alerts, item searches\n• **Pet Records** - Find pets, view consultations, vaccination history\n• **Financial Reports** - Revenue tracking, pending payments, billing info\n• **Vaccination Schedules** - Due dates, overdue reminders, scheduling\n• **Administrative Tasks** - Client communications, report generation\n\nI can access your **real clinic data** to provide accurate, up-to-date information.\n\nWhat would you like to know?",
            'context' => 'greeting',
        ]);

        return response()->json([
            'success' => true,
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'model' => $conversation->model,
                'created_at' => $conversation->created_at->format('M d, Y h:i A'),
                'messages' => [[
                    'id' => (string) $greetingMessage->id,
                    'type' => $greetingMessage->role,
                    'content' => $greetingMessage->content,
                    'context' => $greetingMessage->context,
                    'timestamp' => $greetingMessage->created_at->toISOString(),
                ]],
            ],
        ]);
    }

    /**
     * Update conversation title
     */
    public function updateConversation(Request $request, int $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $conversation = AiConversation::where('user_id', auth()->id())->find($id);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $conversation->update(['title' => $request->input('title')]);

        return response()->json([
            'success' => true,
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
            ],
        ]);
    }

    /**
     * Delete a conversation
     */
    public function deleteConversation(int $id)
    {
        $conversation = AiConversation::where('user_id', auth()->id())->find($id);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted',
        ]);
    }

    /**
     * Send message to conversation
     */
    public function sendMessage(Request $request, int $conversationId)
    {
        // Increase PHP execution time for AI responses
        set_time_limit(180);
        
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $conversation = AiConversation::where('user_id', auth()->id())->find($conversationId);

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $userMessage = $request->input('message');
        $model = $conversation->model;

        // Save user message
        $userMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        try {
            // Build context-aware system prompt
            $systemPrompt = $this->aiService->buildSystemPrompt();

            // Check if user is asking about specific data
            $additionalContext = $this->getAdditionalContext($userMessage);
            if ($additionalContext) {
                $systemPrompt .= "\n\n## SEARCH RESULTS FOR USER QUERY:\n" . $additionalContext;
            }

            // Get conversation history
            $historyMessages = $conversation->messages()
                ->orderBy('created_at')
                ->get()
                ->map(fn($m) => [
                    'role' => $m->role,
                    'content' => $m->content,
                ])
                ->toArray();

            // Build messages array for Ollama
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ...$historyMessages,
            ];

            // Call Ollama API with extended timeout
            $response = Http::timeout(180)->post('http://localhost:11434/api/chat', [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
                'options' => [
                    'temperature' => 0.7,
                    'top_p' => 0.9,
                    'num_predict' => 2048,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $assistantContent = $data['message']['content'] ?? 'I apologize, but I couldn\'t generate a response.';

                // Save assistant message
                $assistantMsg = AiMessage::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'assistant',
                    'content' => $assistantContent,
                    'context' => 'response',
                ]);

                // Update conversation
                $conversation->update([
                    'last_message_at' => now(),
                    'title' => $this->generateTitle($conversation, $userMessage),
                ]);

                return response()->json([
                    'success' => true,
                    'user_message' => [
                        'id' => (string) $userMsg->id,
                        'type' => 'user',
                        'content' => $userMsg->content,
                        'timestamp' => $userMsg->created_at->toISOString(),
                    ],
                    'assistant_message' => [
                        'id' => (string) $assistantMsg->id,
                        'type' => 'assistant',
                        'content' => $assistantMsg->content,
                        'context' => 'response',
                        'timestamp' => $assistantMsg->created_at->toISOString(),
                    ],
                    'conversation_title' => $conversation->title,
                ]);
            }

            // Save error message
            $errorMsg = AiMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => 'Failed to get response from AI model. Please ensure Ollama is running.',
                'context' => 'error',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get response from AI model.',
                'user_message' => [
                    'id' => (string) $userMsg->id,
                    'type' => 'user',
                    'content' => $userMsg->content,
                    'timestamp' => $userMsg->created_at->toISOString(),
                ],
                'error' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            Log::error('AI Assistant error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Save error message
            AiMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => 'An error occurred while processing your request. Please ensure Ollama is running.',
                'context' => 'error',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request.',
                'user_message' => [
                    'id' => (string) $userMsg->id,
                    'type' => 'user',
                    'content' => $userMsg->content,
                    'timestamp' => $userMsg->created_at->toISOString(),
                ],
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a title for the conversation based on the first user message
     */
    private function generateTitle(AiConversation $conversation, string $message): string
    {
        // Only generate title if it's still the default
        if ($conversation->title !== 'New Conversation') {
            return $conversation->title;
        }

        // Take first 50 characters of the message as title
        return Str::limit($message, 50);
    }
}
