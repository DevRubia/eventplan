<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'currency',
        'deposit_percentage',
        'require_reference',
        'confirmation_role',
        'allowed_methods',
        'receipt_prefix',
        'business_name',
        'business_details',
    ];

    protected $casts = [
        'require_reference' => 'boolean',
        'deposit_percentage' => 'integer',
        'allowed_methods' => 'array',
    ];

    // Always work with a single settings row.
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'currency' => 'KES',
            'deposit_percentage' => 30,
            'require_reference' => true,
            'confirmation_role' => 'vendor_or_admin',
            'allowed_methods' => ['mpesa', 'bank', 'cash'],
            'receipt_prefix' => 'EP',
        ]);
    }
}
