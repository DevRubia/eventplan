<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'event_id',
        'client_id',
        'service_id',
        'vendor_id',
        'quantity',
        'unit_price',
        'agreed_price',
        'scheduled_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'agreed_price' => 'decimal:2',
        'quantity' => 'integer',
        'scheduled_date' => 'date',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    // Total confirmed payments against this booking
    public function getPaidAttribute(): string
    {
        return (string) $this->payments()->where('status', 'confirmed')->sum('amount');
    }

    public function getBalanceAttribute(): string
    {
        return (string) max(0, (float) $this->agreed_price - (float) $this->paid);
    }
}
