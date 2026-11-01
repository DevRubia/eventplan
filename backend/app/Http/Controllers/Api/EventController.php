<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    // Client sees their own events; admin sees all.
    public function index(Request $request)
    {
        $query = Event::query()->withCount('bookings');

        if (! $request->user()->isAdmin()) {
            $query->where('client_id', $request->user()->id);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateEvent($request);
        $data['client_id'] = $request->user()->id;

        return response()->json(Event::create($data), 201);
    }

    public function show(Request $request, int $id)
    {
        $event = Event::with(['bookings.service', 'bookings.vendor:id,name', 'bookings.payments'])
            ->findOrFail($id);

        $this->authorizeEvent($request, $event);

        // Budget summary
        $committed = (float) $event->committed;
        $paid = (float) $event->bookings->flatMap->payments
            ->where('status', 'confirmed')->sum('amount');

        return response()->json([
            'event' => $event,
            'summary' => [
                'budget' => (float) $event->budget,
                'committed' => $committed,
                'remaining_budget' => (float) $event->budget - $committed,
                'paid' => $paid,
                'outstanding' => $committed - $paid,
            ],
        ]);
    }

    public function update(Request $request, int $id)
    {
        $event = Event::findOrFail($id);
        $this->authorizeEvent($request, $event);
        $event->update($this->validateEvent($request));

        return response()->json($event);
    }

    public function destroy(Request $request, int $id)
    {
        $event = Event::findOrFail($id);
        $this->authorizeEvent($request, $event);
        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    private function validateEvent(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:100'],
            'event_date' => ['required', 'date'],
            'venue' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'guest_count' => ['nullable', 'integer', 'min:0'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:planning,confirmed,completed,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        abort_unless(
            $request->user()->isAdmin() || $event->client_id === $request->user()->id,
            403,
            'You can only manage your own events.'
        );
    }
}
