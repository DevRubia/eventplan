<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Option;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OptionController extends Controller
{
    // Public: active options, for populating dropdowns.
    // ?group=service_category returns a flat list; otherwise all groups keyed by group.
    public function index(Request $request)
    {
        if ($request->filled('group')) {
            return response()->json(
                Option::active()->ordered()->where('group', $request->string('group'))->get()
            );
        }

        $grouped = Option::active()->ordered()->get()->groupBy('group');

        return response()->json($grouped);
    }

    // Admin: every option (including inactive), grouped.
    public function adminIndex()
    {
        return response()->json(Option::ordered()->get()->groupBy('group'));
    }

    // Admin: create an option in a group.
    public function store(Request $request)
    {
        $data = $request->validate([
            'group' => ['required', Rule::in(Option::GROUPS)],
            'label' => ['required', 'string', 'max:100'],
            'value' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        // payment_method keeps a machine value (e.g. "mobile_money"); category/type/unit
        // store their display text, so the value is the label itself.
        $value = $data['value']
            ?? ($data['group'] === 'payment_method' ? Str::slug($data['label'], '_') : $data['label']);

        $exists = Option::where('group', $data['group'])->where('value', $value)->exists();
        if ($exists) {
            return response()->json(['message' => 'That option already exists in this group.'], 422);
        }

        $option = Option::create([
            'group' => $data['group'],
            'value' => $value,
            'label' => $data['label'],
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => true,
        ]);

        return response()->json($option, 201);
    }

    // Admin: edit label / order.
    public function update(Request $request, int $id)
    {
        $option = Option::findOrFail($id);
        $data = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
        $option->update($data);

        return response()->json($option);
    }

    // Admin: activate / deactivate (hides from dropdowns without deleting history).
    public function toggle(int $id)
    {
        $option = Option::findOrFail($id);
        $option->update(['is_active' => ! $option->is_active]);

        return response()->json($option);
    }

    // Admin: delete an option.
    public function destroy(int $id)
    {
        Option::findOrFail($id)->delete();

        return response()->json(['message' => 'Option deleted.']);
    }
}
