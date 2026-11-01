<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'items' => Notification::where('user_id', $request->user()->id)->latest()->limit(50)->get(),
            'unread' => Notification::where('user_id', $request->user()->id)->where('is_read', false)->count(),
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->update(['is_read' => true]);

        return response()->json($n);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
