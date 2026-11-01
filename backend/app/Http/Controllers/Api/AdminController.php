<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Payment;
use App\Models\User;
use App\Models\VendorProfile;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // List / filter users.
    public function users(Request $request)
    {
        $query = User::query()->with('vendorProfile');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        return response()->json($query->latest()->get());
    }

    // Activate / deactivate a user account.
    public function toggleUser(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => ! $user->is_active]);

        return response()->json($user);
    }

    // Verify / unverify a vendor so they appear in public listings.
    public function verifyVendor(int $id)
    {
        $profile = VendorProfile::findOrFail($id);
        $profile->update(['is_verified' => ! $profile->is_verified]);

        return response()->json($profile);
    }

    // Headline reports for the admin dashboard.
    public function reports()
    {
        return response()->json([
            'users' => [
                'total' => User::count(),
                'clients' => User::where('role', 'client')->count(),
                'vendors' => User::where('role', 'vendor')->count(),
            ],
            'vendors_pending_verification' => VendorProfile::where('is_verified', false)->count(),
            'events' => Event::count(),
            'bookings' => [
                'total' => Booking::count(),
                'requested' => Booking::where('status', 'requested')->count(),
                'confirmed' => Booking::where('status', 'confirmed')->count(),
                'completed' => Booking::where('status', 'completed')->count(),
            ],
            'payments' => [
                'confirmed_total' => (float) Payment::where('status', 'confirmed')->sum('amount'),
                'pending_count' => Payment::where('status', 'pending')->count(),
            ],
            'bookings_by_category' => Booking::query()
                ->join('services', 'bookings.service_id', '=', 'services.id')
                ->selectRaw('services.category as category, count(*) as total')
                ->groupBy('services.category')
                ->pluck('total', 'category'),
        ]);
    }
}
