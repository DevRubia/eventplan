<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Option;
use App\Models\Payment;
use App\Models\PaymentSetting;
use App\Models\Service;
use App\Models\User;
use App\Models\VendorProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Configurable dropdown options (admin can change these later) ----
        $this->seedOptions();

        // ---- Payment configuration (single row) ----
        PaymentSetting::current()->update([
            'currency' => 'KES',
            'deposit_percentage' => 30,
            'require_reference' => true,
            'confirmation_role' => 'vendor_or_admin',
            'allowed_methods' => ['mpesa', 'bank', 'cash'],
            'receipt_prefix' => 'EP',
            'business_name' => 'EventPlan Ltd',
            'business_details' => 'M-Pesa Paybill: 123456  ·  Account: your event ref',
        ]);

        // ---- Admin ----
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@eventplan.test',
            'phone' => '0700000000',
            'role' => 'admin',
            'password' => Hash::make('password'),
        ]);

        // ---- Client ----
        $client = User::create([
            'name' => 'Mary Client',
            'email' => 'client@eventplan.test',
            'phone' => '0711111111',
            'role' => 'client',
            'password' => Hash::make('password'),
        ]);

        // ---- Vendors with profiles & services ----
        $vendorData = [
            ['Nairobi Caterers', 'Catering', 'Delicious catering for all events.', 'Nairobi',
                [['Full Buffet Package', 'per plate', 1200], ['VIP Plated Dinner', 'per plate', 2500]]],
            ['Bloom & Decor', 'Decor', 'Elegant decor and floral arrangements.', 'Nairobi',
                [['Wedding Decor Package', 'per event', 80000], ['Backdrop & Stage', 'per event', 35000]]],
            ['SnapShot Studios', 'Photography', 'Professional event photography & video.', 'Mombasa',
                [['Photography (Full Day)', 'per day', 45000], ['Photo + Video Combo', 'per day', 90000]]],
            ['BeatMasters DJ', 'DJ', 'Sound, lighting and live DJ services.', 'Nakuru',
                [['DJ + Sound System', 'per event', 40000], ['Live Band', 'per event', 120000]]],
        ];

        foreach ($vendorData as $i => [$name, $category, $desc, $location, $services]) {
            $vendorUser = User::create([
                'name' => $name,
                'email' => 'vendor' . ($i + 1) . '@eventplan.test',
                'phone' => '07222222' . $i . $i,
                'role' => 'vendor',
                'password' => Hash::make('password'),
            ]);

            VendorProfile::create([
                'user_id' => $vendorUser->id,
                'business_name' => $name,
                'category' => $category,
                'description' => $desc,
                'location' => $location,
                'phone' => $vendorUser->phone,
                'is_verified' => true,
            ]);

            foreach ($services as [$sName, $unit, $price]) {
                Service::create([
                    'vendor_id' => $vendorUser->id,
                    'category' => $category,
                    'name' => $sName,
                    'description' => $desc,
                    'price' => $price,
                    'unit' => $unit,
                    'is_active' => true,
                ]);
            }
        }

        // ---- A sample event with a booking and a confirmed deposit ----
        $event = Event::create([
            'client_id' => $client->id,
            'title' => 'Jane & John Wedding',
            'type' => 'Wedding',
            'event_date' => now()->addMonths(2)->toDateString(),
            'venue' => 'Garden Court Hotel',
            'location' => 'Nairobi',
            'guest_count' => 200,
            'budget' => 600000,
            'status' => 'planning',
        ]);

        $cateringService = Service::where('name', 'Full Buffet Package')->first();

        $booking = Booking::create([
            'event_id' => $event->id,
            'client_id' => $client->id,
            'service_id' => $cateringService->id,
            'vendor_id' => $cateringService->vendor_id,
            'quantity' => 200,
            'unit_price' => $cateringService->price,
            'agreed_price' => (float) $cateringService->price * 200,
            'scheduled_date' => $event->event_date,
            'status' => 'accepted',
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'recorded_by' => $client->id,
            'confirmed_by' => $cateringService->vendor_id,
            'amount' => 72000, // 30% deposit of 240,000
            'method' => 'mpesa',
            'reference' => 'QFT7XABC12',
            'type' => 'deposit',
            'status' => 'confirmed',
            'paid_at' => now()->toDateString(),
            'note' => 'Deposit for catering.',
        ]);
    }

    private function seedOptions(): void
    {
        $defaults = [
            'service_category' => ['Catering', 'Decor', 'Photography', 'DJ', 'Venue', 'Florist', 'Transport', 'Other'],
            'event_type' => ['Wedding', 'Birthday', 'Corporate', 'Conference', 'Graduation', 'Other'],
            'service_unit' => ['per event', 'per plate', 'per hour', 'per day'],
            'payment_method' => ['mpesa' => 'M-Pesa', 'bank' => 'Bank Transfer', 'cash' => 'Cash'],
        ];

        foreach ($defaults as $group => $items) {
            $order = 0;
            foreach ($items as $key => $label) {
                // payment_method uses explicit value=>label (e.g. mpesa => M-Pesa);
                // category/type/unit store their display text, so value == label.
                $value = is_string($key) ? $key : $label;
                Option::updateOrCreate(
                    ['group' => $group, 'value' => $value],
                    ['label' => $label, 'sort_order' => $order++, 'is_active' => true],
                );
            }
        }
    }
}
