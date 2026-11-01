<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OptionController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentSettingController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes (no login required)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public browsing of the vendor & service catalogue.
Route::get('/vendors', [VendorController::class, 'index']);
Route::get('/vendors/{id}', [VendorController::class, 'show']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);

// Public: configurable dropdown options (categories, event types, units, methods).
Route::get('/options', [OptionController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Payment settings: read for all, update for admin.
    Route::get('/payment-settings', [PaymentSettingController::class, 'show']);

    // Notifications (all roles)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Bookings (role-aware inside controller)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);

    // Booking messages
    Route::get('/bookings/{booking}/messages', [MessageController::class, 'index']);
    Route::post('/bookings/{booking}/messages', [MessageController::class, 'store']);

    // Payments (participants record; confirmers confirm)
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}/receipt', [PaymentController::class, 'receipt']);
    Route::patch('/payments/{id}/confirm', [PaymentController::class, 'confirm']);
    Route::patch('/payments/{id}/reject', [PaymentController::class, 'reject']);

    /*
    | Client-only
    */
    Route::middleware('role:client,admin')->group(function () {
        Route::apiResource('events', EventController::class);
        Route::post('/bookings', [BookingController::class, 'store']);
    });

    /*
    | Vendor-only
    */
    Route::middleware('role:vendor')->group(function () {
        Route::get('/vendor/profile', [VendorController::class, 'myProfile']);
        Route::put('/vendor/profile', [VendorController::class, 'updateProfile']);
        Route::get('/vendor/services', [ServiceController::class, 'mine']);
        Route::post('/vendor/services', [ServiceController::class, 'store']);
        Route::put('/vendor/services/{id}', [ServiceController::class, 'update']);
        Route::patch('/vendor/services/{id}/toggle', [ServiceController::class, 'toggleActive']);
        Route::delete('/vendor/services/{id}', [ServiceController::class, 'destroy']);
    });

    /*
    | Admin-only
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}/toggle', [AdminController::class, 'toggleUser']);
        Route::patch('/vendors/{id}/verify', [AdminController::class, 'verifyVendor']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::put('/payment-settings', [PaymentSettingController::class, 'update']);

        // System configuration (dropdown options)
        Route::get('/options', [OptionController::class, 'adminIndex']);
        Route::post('/options', [OptionController::class, 'store']);
        Route::put('/options/{id}', [OptionController::class, 'update']);
        Route::patch('/options/{id}/toggle', [OptionController::class, 'toggle']);
        Route::delete('/options/{id}', [OptionController::class, 'destroy']);
    });
});
