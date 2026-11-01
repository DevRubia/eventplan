<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Payment;
use App\Models\Service;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Role-aware summary for the logged-in user's home dashboard.
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isClient()) {
            $eventIds = Event::where('client_id', $user->id)->pluck('id');

            return response()->json([
                'role' => 'client',
                'events' => $eventIds->count(),
                'bookings' => Booking::where('client_id', $user->id)->count(),
                'pending_bookings' => Booking::where('client_id', $user->id)->where('status', 'requested')->count(),
                'confirmed_paid' => (float) Payment::whereHas('booking', fn ($q) => $q->where('client_id', $user->id))
                    ->where('status', 'confirmed')->sum('amount'),
            ]);
        }

        if ($user->isVendor()) {
            return response()->json([
                'role' => 'vendor',
                'services' => Service::where('vendor_id', $user->id)->count(),
                'bookings' => Booking::where('vendor_id', $user->id)->count(),
                'new_requests' => Booking::where('vendor_id', $user->id)->where('status', 'requested')->count(),
                'earnings_confirmed' => (float) Payment::whereHas('booking', fn ($q) => $q->where('vendor_id', $user->id))
                    ->where('status', 'confirmed')->sum('amount'),
                'payments_to_confirm' => Payment::whereHas('booking', fn ($q) => $q->where('vendor_id', $user->id))
                    ->where('status', 'pending')->count(),
            ]);
        }

        // admin
        return response()->json([
            'role' => 'admin',
            'events' => Event::count(),
            'bookings' => Booking::count(),
            'confirmed_revenue' => (float) Payment::where('status', 'confirmed')->sum('amount'),
            'pending_payments' => Payment::where('status', 'pending')->count(),
        ]);
    }
}
