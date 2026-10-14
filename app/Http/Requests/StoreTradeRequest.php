<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;
        $isClosed = $this->input('status') === 'closed';

        return [
            'symbol' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9._\/-]+$/'],
            'market_type' => ['required', Rule::in(['crypto', 'forex', 'stocks', 'commodities'])],
            'direction' => ['required', Rule::in(['long', 'short'])],
            'status' => ['required', Rule::in(['open', 'closed'])],
            'entry_price' => ['required', 'numeric', 'gt:0'],
            'exit_price' => [
                Rule::requiredIf($isClosed),
                'nullable',
                'numeric',
                'gt:0',
            ],
            'mark_price' => ['nullable', 'numeric', 'gt:0'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'contract_multiplier' => ['nullable', 'numeric', 'gt:0'],
            'stop_loss' => ['nullable', 'numeric', 'gt:0'],
            'take_profit' => ['nullable', 'numeric', 'gt:0'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'funding_costs' => ['nullable', 'numeric', 'min:0'],
            'entry_time' => ['required', 'date'],
            'exit_time' => [
                Rule::requiredIf($isClosed),
                'nullable',
                'date',
                'after_or_equal:entry_time',
            ],
            'strategy_id' => [
                'nullable',
                'integer',
                Rule::exists('strategies', 'id')->where('user_id', $userId),
            ],
            'setup_description' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'mistake_tags' => ['nullable', 'array', 'max:15'],
            'mistake_tags.*' => ['string', 'max:60'],
            'screenshot' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120', // 5 MB max
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'exit_price.required' => 'Closed trades require a valid exit price.',
            'exit_time.required' => 'Closed trades require an exit date and time.',
            'exit_time.after_or_equal' => 'Exit time cannot be earlier than entry time.',
        ];
    }
}