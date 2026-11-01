<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Thread of messages for a booking (client <-> vendor).
    public function index(Request $request, int $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);
        $this->authorizeParticipant($request, $booking);

        // Mark messages addressed to me as read.
        Message::where('booking_id', $bookingId)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(
            Message::with('sender:id,name')->where('booking_id', $bookingId)->oldest()->get()
        );
    }

    public function store(Request $request, int $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);
        $this->authorizeParticipant($request, $booking);

        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = Message::create([
            'booking_id' => $booking->id,
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $target = $request->user()->id === $booking->client_id ? $booking->vendor_id : $booking->client_id;
        Notification::create([
            'user_id' => $target,
            'title' => 'New message',
            'body' => \Illuminate\Support\Str::limit($data['body'], 60),
            'type' => 'info',
        ]);

        return response()->json($message->load('sender:id,name'), 201);
    }

    private function authorizeParticipant(Request $request, Booking $booking): void
    {
        $user = $request->user();
        abort_unless(
            $user->isAdmin() || $booking->client_id === $user->id || $booking->vendor_id === $user->id,
            403,
            'This conversation is not yours.'
        );
    }
}
