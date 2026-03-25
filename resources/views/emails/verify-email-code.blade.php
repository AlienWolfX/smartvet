<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f6f8fb;
            color: #334155;
        }
        .email-container {
            max-width: 600px;
            margin: 24px auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(15, 23, 42, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
            color: #fff;
            padding: 22px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.3rem;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 24px;
            line-height: 1.6;
            font-size: 15px;
        }
        .code-box {
            margin: 20px 0;
            background: #f1f5f9;
            border: 1px dashed #94a3b8;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            letter-spacing: 0.25rem;
            color: #1e3a8a;
        }
        .cta {
            display: inline-block;
            margin-top: 16px;
            padding: 10px 16px;
            border-radius: 999px;
            background-color: #3084ff;
            color: white;
            text-decoration: none;
            font-weight: 600;
        }
        .footer {
            padding: 14px 24px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Confirm Your Email</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{ $name }}</strong>,</p>

            <p>Thanks for creating your SmartVet account. Use the verification code below to confirm your email address and finish setting up your account.</p>

            <div class="code-box">{{ $code }}</div>

            <p class="subtext">This code is valid for 30 minutes. If it expires, request a new code on the verification page.</p>

            <p>If you didn’t create this account, you can safely ignore this email and no action is required.</p>
        </div>
        <div class="footer">
            <p>Need help? Contact <a href="mailto:support@smartvet.com" style="color:#1d4ed8; text-decoration: none;">support@smartvet.com</a></p>
            <p>SmartVet • Keeping your pet health records safe</p>
        </div>
    </div>
</body>
</html>
