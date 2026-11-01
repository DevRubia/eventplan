<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Service;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    // Role-aware list: client -> their bookings, vendor -> bookings for them, admin -> all.
    public function index(Request $request)
    {
        $query = Booking::query()
            ->with(['service:id,name,category', 'event:id,title,event_date', 'client:id,name', 'vendor:id,name']);

        $user = $request->user();
        if ($user->isClient()) {
            $query->where('client_id', $user->id);
        } elseif ($user->isVendor()) {
            $query->where('vendor_id', $user->id);
        }

        return response()->json($query->latest()->get());
    }

    // Client books a service for one of their events.
    public function store(Request $request)
    {
        $data = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'service_id' => ['required', 'exists:services,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'scheduled_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $event = Event::findOrFail($data['event_id']);
        abort_unless($event->client_id === $request->user()->id, 403, 'That event is not yours.');

        if (in_array($event->status, ['cancelled', 'completed'], true)) {
            abort(422, "You cannot add bookings to a {$event->status} event.");
        }

        $service = Service::findOrFail($data['service_id']);
        abort_if(! $service->is_active, 422, 'This service is no longer available for booking.');

        $booking = Booking::create([
            'event_id' => $event->id,
            'client_id' => $request->user()->id,
            'service_id' => $service->id,
            'vendor_id' => $service->vendor_id,
            'quantity' => $data['quantity'],
            'unit_price' => $service->price,
            'agreed_price' => (float) $service->price * $data['quantity'],
            'scheduled_date' => $data['scheduled_date'] ?? $event->event_date,
            'status' => 'requested',
            'notes' => $data['notes'] ?? null,
        ]);

        $this->notify($service->vendor_id, 'New booking request',
            "{$request->user()->name} requested \"{$service->name}\" for {$event->title}.", 'booking');

        // A new pending request means the event is not fully confirmed yet.
        $event->syncStatus();

        return response()->json($booking->load(['service', 'event', 'vendor:id,name']), 201);
    }

    public function show(Request $request, int $id)
    {
        $booking = Booking::with(['service', 'event', 'client:id,name,phone', 'vendor:id,name,phone', 'payments.recorder:id,name', 'payments.confirmer:id,name'])
            ->findOrFail($id);

        $this->authorizeParticipant($request, $booking);

        return response()->json([
            'booking' => $booking,
            'paid' => (float) $booking->paid,
            'balance' => (float) $booking->balance,
        ]);
    }

    // Vendor: accept / decline / complete. Client: cancel.
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'status' => ['required', 'in:accepted,declined,confirmed,completed,cancelled'],
        ]);

        $booking = Booking::with('service', 'event')->findOrFail($id);
        $user = $request->user();
        $new = $data['status'];

        // A finished booking is locked — it cannot move to another status.
        if (in_array($booking->status, ['completed', 'cancelled', 'declined'], true)) {
            abort(422, "This booking is already {$booking->status} and can no longer be changed.");
        }

        $vendorActions = ['accepted', 'declined', 'confirmed', 'completed'];
        $clientActions = ['cancelled'];

        if ($user->isVendor() && $booking->vendor_id === $user->id && in_array($new, $vendorActions, true)) {
            // allowed
        } elseif ($user->isClient() && $booking->client_id === $user->id && in_array($new, $clientActions, true)) {
            // allowed
        } elseif ($user->isAdmin()) {
            // admin can set anything
        } else {
            abort(403, 'You cannot change this booking to that status.');
        }

        $booking->update(['status' => $new]);

        // Notify the other party
        $target = $user->id === $booking->client_id ? $booking->vendor_id : $booking->client_id;
        $this->notify($target, 'Booking updated',
            "Booking for \"{$booking->service->name}\" is now {$new}.", 'booking');

        // Keep the parent event's status in step with its bookings.
        $eventStatus = $booking->event->syncStatus();
        if ($eventStatus === 'completed') {
            $this->notify($booking->client_id, 'Event completed',
                "All services for \"{$booking->event->title}\" are completed.", 'info');
        }

        return response()->json($booking->fresh('event'));
    }

    private function authorizeParticipant(Request $request, Booking $booking): void
    {
        $user = $request->user();
        abort_unless(
            $user->isAdmin() || $booking->client_id === $user->id || $booking->vendor_id === $user->id,
            403,
            'This booking is not yours.'
        );
    }

    private function notify(int $userId, string $title, string $body, string $type): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'type' => $type,
        ]);
    }
}
