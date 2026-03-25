<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class EmailVerificationCode extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $code)
    {
    }

    public function build(): self
    {
        return $this->subject('Verify your SmartVet email')
            ->view('emails.verify-email-code')
            ->with([
                'name' => $this->user->name,
                'code' => $this->code,
            ]);
    }
}
