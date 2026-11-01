<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentSettingController extends Controller
{
    // Any authenticated user can read settings (clients need to see paybill/deposit rules).
    public function show()
    {
        return response()->json(PaymentSetting::current());
    }

    // Admin only (enforced on the route).
    public function update(Request $request)
    {
        $data = $request->validate([
            'currency' => ['required', 'string', 'max:10'],
            'deposit_percentage' => ['required', 'integer', 'min:0', 'max:100'],
            'require_reference' => ['required', 'boolean'],
            'confirmation_role' => ['required', 'in:admin,vendor_or_admin'],
            'allowed_methods' => ['required', 'array', 'min:1'],
            // Methods must be real payment_method options (admin-configurable).
            'allowed_methods.*' => [Rule::exists('options', 'value')->where('group', 'payment_method')],
            'receipt_prefix' => ['required', 'string', 'max:20'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'business_details' => ['nullable', 'string'],
        ]);

        $settings = PaymentSetting::current();
        $settings->update($data);

        return response()->json($settings);
    }
}
