<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    // List payments (admin: all; client/vendor: only theirs). Optional ?booking_id=
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Payment::query()
            ->with(['booking.service:id,name', 'booking.event:id,title', 'recorder:id,name', 'confirmer:id,name']);

        if ($request->filled('booking_id')) {
            $query->where('booking_id', $request->integer('booking_id'));
        }

        if ($user->isClient()) {
            $query->whereHas('booking', fn ($q) => $q->where('client_id', $user->id));
        } elseif ($user->isVendor()) {
            $query->whereHas('booking', fn ($q) => $q->where('vendor_id', $user->id));
        }

        return response()->json($query->latest()->get());
    }

    // Record a payment that was made OUTSIDE the system (M-Pesa / bank / cash).
    public function store(Request $request)
    {
        $settings = PaymentSetting::current();
        $allowed = $settings->allowed_methods ?: ['mpesa', 'bank', 'cash'];

        $rules = [
            'booking_id' => ['required', 'exists:bookings,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', Rule::in($allowed)],
            'type' => ['required', 'in:deposit,balance,full'],
            'paid_at' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'reference' => [$settings->require_reference ? 'required' : 'nullable', 'string', 'max:100'],
        ];
        $data = $request->validate($rules, [
            'reference.required' => 'A payment reference (e.g. M-Pesa code or bank slip no.) is required.',
        ]);

        $booking = Booking::findOrFail($data['booking_id']);
        $this->authorizeParticipant($request, $booking);

        // Cannot record a payment against a booking that is no longer active.
        if (in_array($booking->status, ['declined', 'cancelled'], true)) {
            abort(422, "You cannot record a payment for a booking that was {$booking->status}.");
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'recorded_by' => $request->user()->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'type' => $data['type'],
            'paid_at' => $data['paid_at'],
            'note' => $data['note'] ?? null,
            'status' => 'pending',
        ]);

        // Notify whoever is allowed to confirm (vendor and/or admin).
        $this->notify($booking->vendor_id, 'Payment awaiting confirmation',
            "A {$data['method']} payment of {$settings->currency} {$data['amount']} was recorded. Please verify.", 'payment');

        return response()->json($payment->load('recorder:id,name'), 201);
    }

    // Confirm a recorded payment (verified against the real M-Pesa/bank statement).
    public function confirm(Request $request, int $id)
    {
        $payment = Payment::with('booking')->findOrFail($id);
        $this->authorizeConfirmer($request, $payment->booking);

        if ($payment->status === 'confirmed') {
            return response()->json(['message' => 'Payment is already confirmed.'], 422);
        }

        $payment->update([
            'status' => 'confirmed',
            'confirmed_by' => $request->user()->id,
        ]);

        $this->notify($payment->booking->client_id, 'Payment confirmed',
            'Your payment has been confirmed. Thank you!', 'payment');

        return response()->json($payment->fresh('confirmer'));
    }

    public function reject(Request $request, int $id)
    {
        $payment = Payment::with('booking')->findOrFail($id);
        $this->authorizeConfirmer($request, $payment->booking);

        $payment->update([
            'status' => 'rejected',
            'confirmed_by' => $request->user()->id,
        ]);

        $this->notify($payment->booking->client_id, 'Payment not confirmed',
            'A recorded payment could not be verified. Please check the reference and try again.', 'payment');

        return response()->json($payment);
    }

    // A simple receipt payload for a confirmed payment.
    public function receipt(Request $request, int $id)
    {
        $payment = Payment::with(['booking.service:id,name', 'booking.event:id,title', 'booking.client:id,name', 'confirmer:id,name'])
            ->findOrFail($id);
        $this->authorizeParticipant($request, $payment->booking);

        $settings = PaymentSetting::current();

        return response()->json([
            'receipt_no' => $settings->receipt_prefix . '-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT),
            'business_name' => $settings->business_name,
            'currency' => $settings->currency,
            'payment' => $payment,
        ]);
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

    // Who may confirm is governed by payment settings.
    private function authorizeConfirmer(Request $request, Booking $booking): void
    {
        $user = $request->user();
        $settings = PaymentSetting::current();

        if ($user->isAdmin()) {
            return;
        }

        if ($settings->confirmation_role === 'vendor_or_admin'
            && $user->isVendor() && $booking->vendor_id === $user->id) {
            return;
        }

        abort(403, 'You are not allowed to confirm payments.');
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
