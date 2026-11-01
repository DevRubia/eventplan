<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VendorProfile;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    // Public: browse verified vendors, with optional category / search filters.
    public function index(Request $request)
    {
        $query = VendorProfile::query()
            ->with('user:id,name,email')
            ->where('is_verified', true);

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(fn ($q) => $q
                ->where('business_name', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%")
                ->orWhere('location', 'like', "%{$s}%"));
        }

        return response()->json($query->latest()->get());
    }

    // Public: a single vendor with their active services.
    public function show(int $id)
    {
        $vendor = VendorProfile::with('user:id,name,email')->findOrFail($id);
        $services = $vendor->user->services()->where('is_active', true)->get();

        return response()->json([
            'vendor' => $vendor,
            'services' => $services,
        ]);
    }

    // Vendor: view own profile.
    public function myProfile(Request $request)
    {
        $profile = VendorProfile::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['business_name' => $request->user()->name, 'category' => 'Other']
        );

        return response()->json($profile);
    }

    // Vendor: update own profile.
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $profile = VendorProfile::where('user_id', $request->user()->id)->firstOrFail();
        $profile->update($data);

        return response()->json($profile);
    }
}
