<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // Public: browse & compare active services from verified vendors.
    public function index(Request $request)
    {
        $query = Service::query()
            ->with('vendor:id,name')
            ->where('is_active', true);

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%"));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->float('max_price'));
        }

        $sort = $request->string('sort')->toString();
        $query->orderBy('price', $sort === 'price_desc' ? 'desc' : 'asc');

        return response()->json($query->get());
    }

    public function show(int $id)
    {
        return response()->json(Service::with('vendor:id,name')->findOrFail($id));
    }

    // Vendor: list own services.
    public function mine(Request $request)
    {
        return response()->json(
            Service::where('vendor_id', $request->user()->id)->latest()->get()
        );
    }

    // Vendor: create a service.
    public function store(Request $request)
    {
        $data = $this->validateService($request);
        $data['vendor_id'] = $request->user()->id;

        return response()->json(Service::create($data), 201);
    }

    // Vendor: update own service.
    public function update(Request $request, int $id)
    {
        $service = Service::where('vendor_id', $request->user()->id)->findOrFail($id);
        $service->update($this->validateService($request));

        return response()->json($service);
    }

    // Vendor: delete own service.
    public function destroy(Request $request, int $id)
    {
        $service = Service::where('vendor_id', $request->user()->id)->findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    // Vendor: temporarily deactivate / reactivate own service.
    // Deactivated services are hidden from browsing and cannot be booked,
    // but existing bookings are unaffected.
    public function toggleActive(Request $request, int $id)
    {
        $service = Service::where('vendor_id', $request->user()->id)->findOrFail($id);
        $service->update(['is_active' => ! $service->is_active]);

        return response()->json($service);
    }

    private function validateService(Request $request): array
    {
        return $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);
    }
}
