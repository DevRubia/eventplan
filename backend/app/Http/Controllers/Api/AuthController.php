<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VendorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    // Register a client or a vendor. Admins are seeded, not self-registered.
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'role' => ['required', Rule::in(['client', 'vendor'])],
            // required only when registering as a vendor
            'business_name' => ['required_if:role,vendor', 'string', 'max:255'],
            'category' => ['required_if:role,vendor', 'string', 'max:100'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
        ]);

        if ($user->role === 'vendor') {
            VendorProfile::create([
                'user_id' => $user->id,
                'business_name' => $data['business_name'],
                'category' => $data['category'],
                'phone' => $data['phone'] ?? null,
            ]);
        }

        $token = $user->createToken('eventplan')->plainTextToken;

        return response()->json([
            'user' => $user->load('vendorProfile'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        $token = $user->createToken('eventplan')->plainTextToken;

        return response()->json([
            'user' => $user->load('vendorProfile'),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('vendorProfile'));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
