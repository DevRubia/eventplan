<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'client_id',
        'title',
        'type',
        'event_date',
        'venue',
        'location',
        'guest_count',
        'budget',
        'status',
        'notes',
    ];

    protected $casts = [
        'event_date' => 'date',
        'budget' => 'decimal:2',
        'guest_count' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    // Sum of agreed prices of non-cancelled bookings = planned spend
    public function getCommittedAttribute(): string
    {
        return (string) $this->bookings()
            ->whereNotIn('status', ['declined', 'cancelled'])
            ->sum('agreed_price');
    }

    /**
     * Keep the event status in step with its bookings.
     * - all active bookings completed  -> event completed
     * - all active bookings confirmed+ -> event confirmed
     * - otherwise                      -> event planning
     * A cancelled event is left untouched. Returns the new status if it changed.
     */
    public function syncStatus(): ?string
    {
        if ($this->status === 'cancelled') {
            return null;
        }

        $active = $this->bookings()
            ->whereNotIn('status', ['declined', 'cancelled'])
            ->pluck('status');

        if ($active->isEmpty()) {
            return null; // nothing to base a change on; keep as-is (planning)
        }

        if ($active->every(fn ($s) => $s === 'completed')) {
            $new = 'completed';
        } elseif ($active->every(fn ($s) => in_array($s, ['confirmed', 'completed'], true))) {
            $new = 'confirmed';
        } else {
            $new = 'planning';
        }

        if ($this->status !== $new) {
            $this->update(['status' => $new]);

            return $new;
        }

        return null;
    }
}
