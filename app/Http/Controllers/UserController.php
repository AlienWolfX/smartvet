<?php

namespace App\Http\Controllers;

use App\Mail\EmailVerificationCode;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class UserController extends Controller
{
    public function index()
    {
        $users = User::whereNotIn('role', [User::ROLE_OWNER])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'clinicName' => $user->clinic_name ?? '',
                    'email' => $user->email,
                    'role' => $user->role ?? 'clinic',
                    'status' => $user->status ?? 'active',
                    'lastLogin' => $user->last_login_at?->toISOString(),
                    'createdAt' => $user->created_at->toISOString(),
                ];
            });

        $stats = [
            'totalUsers' => User::whereNotIn('role', [User::ROLE_OWNER])->count(),
            'activeUsers' => User::whereNotIn('role', [User::ROLE_OWNER])->where('status', 'active')->count(),
            'staffUsers' => User::where('role', 'clinic')->count(),
            'adminUsers' => User::where('role', 'admin')->count(),
        ];

        return Inertia::render('user-management', [
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|in:admin,clinic',
            'clinic_name' => 'required_if:role,clinic|string|max:255',
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => 'active',
            'clinic_name' => $validated['role'] === 'clinic' ? $validated['clinic_name'] : null,
        ];

        if ($validated['role'] === 'clinic') {
            $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $userData['email_verified_at'] = null;
            $userData['email_verification_code'] = $verificationCode;
            $userData['email_verification_expires_at'] = Carbon::now()->addMinutes(3);
        }

        $user = User::create($userData);

        if ($validated['role'] === 'clinic') {
            Mail::to($user->email)->send(new EmailVerificationCode($user, $verificationCode));
        }

        return redirect()->back()->with('success', 'User created successfully!');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,clinic',
            'status' => 'required|in:active,inactive,suspended',
            'clinic_name' => 'required_if:role,clinic|string|max:255',
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status'],
            'clinic_name' => $validated['role'] === 'clinic' ? $validated['clinic_name'] : null,
        ];

        $user->update($userData);

        return redirect()->back()->with('success', 'User updated successfully!');
    }

    public function toggleStatus(User $user)
    {
        $newStatus = $user->status === 'active' ? 'suspended' : 'active';
        $user->update(['status' => $newStatus]);

        return redirect()->back()->with('success', 'User status updated successfully!');
    }

    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->withErrors(['general' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully!');
    }

    public function export(Request $request)
    {
        $request->validate([
            'role' => ['nullable', 'in:all,admin,clinic'],
            'status' => ['nullable', 'in:all,active,inactive,suspended'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $usersQuery = User::orderBy('name');

        $role = $request->string('role')->toString();
        if ($role && $role !== 'all') {
            $usersQuery->where('role', $role);
        }

        $status = $request->string('status')->toString();
        if ($status && $status !== 'all') {
            $usersQuery->where('status', $status);
        }

        if ($request->filled('date_from')) {
            $usersQuery->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $usersQuery->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $users = $usersQuery->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Users');

        $headers = [
            'ID',
            'Name',
            'Email',
            'Role',
            'Status',
            'Last Login',
            'Created At',
        ];

        foreach ($headers as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($users as $user) {
            $sheet->setCellValue("A{$row}", $user->id);
            $sheet->setCellValue("B{$row}", $user->name);
            $sheet->setCellValue("C{$row}", $user->email);
            $sheet->setCellValue("D{$row}", ucfirst($user->role ?? 'clinic'));
            $sheet->setCellValue("E{$row}", ucfirst($user->status ?? 'active'));
            $sheet->setCellValue("F{$row}", $user->last_login_at?->format('Y-m-d H:i:s') ?? 'Never');
            $sheet->setCellValue("G{$row}", $user->created_at?->format('Y-m-d H:i:s'));
            $row++;
        }

        foreach (range('A', 'G') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $fileName = 'users-export-' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
