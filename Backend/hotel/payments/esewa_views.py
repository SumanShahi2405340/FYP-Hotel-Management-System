# payments/esewa_views.py
# Real eSewa ePay v2 integration
# pip install requests qrcode[pil] Pillow hmac hashlib

import hmac
import hashlib
import base64
import uuid
import json
import io
import requests
import qrcode
from PIL import Image
from django.conf import settings
from django.utils import timezone  # ← ADD THIS LINE
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny  # ← ADD AllowAny
from rest_framework.response import Response
from rest_framework import status

# ─── eSewa API endpoints ────────────────────────────────────────────────────
ESEWA_TEST_INITIATE = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
ESEWA_LIVE_INITIATE = "https://epay.esewa.com.np/api/epay/main/v2/form"
ESEWA_TEST_VERIFY   = "https://rc-epay.esewa.com.np/api/epay/transaction/v2/verify/"
ESEWA_LIVE_VERIFY   = "https://epay.esewa.com.np/api/epay/transaction/v2/verify/"


def generate_esewa_signature(message: str, secret: str) -> str:
    """
    Generate HMAC-SHA256 signature as required by eSewa v2 API.
    message = "total_amount=<amount>,transaction_uuid=<uuid>,product_code=<code>"
    """
    key = secret.encode("utf-8")
    msg = message.encode("utf-8")
    h = hmac.new(key, msg, hashlib.sha256)
    return base64.b64encode(h.digest()).decode("utf-8")


def qr_to_base64(data: str) -> str:
    """Generate QR code from data string and return as base64 PNG."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/payments/esewa/initiate/
# Frontend sends: booking_id, amount, esewa_id, password, merchant_id,
#                 secret_key, environment, success_url, failure_url
# Returns: { transaction_uuid, qr_image_base64, payment_url, form_data }
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def esewa_initiate(request):
    data        = request.data
    booking_id  = data.get("booking_id")
    amount      = data.get("amount")          # e.g. "150000.00"
    esewa_id    = data.get("esewa_id")        # user's eSewa mobile
    password    = data.get("password")        # user's eSewa password
    merchant_id = data.get("merchant_id", getattr(settings, "ESEWA_MERCHANT_ID", "EPAYTEST"))
    secret_key  = data.get("secret_key",  getattr(settings, "ESEWA_SECRET_KEY",  "8gBm/:&EnhH.1/q"))
    environment = data.get("environment", "test")
    product_name = data.get("product_name", f"Booking-{booking_id}")
    success_url = data.get("success_url")
    failure_url = data.get("failure_url")

    # Validate
    if not all([amount, esewa_id, password, success_url, failure_url]):
        return Response({"message": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount_str = str(float(amount))
    except (ValueError, TypeError):
        return Response({"message": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique transaction ID
    transaction_uuid = f"HMS-{booking_id}-{uuid.uuid4().hex[:12].upper()}"

    # Build signature string: "total_amount=X,transaction_uuid=Y,product_code=Z"
    sig_string = f"total_amount={amount_str},transaction_uuid={transaction_uuid},product_code={merchant_id}"
    signature  = generate_esewa_signature(sig_string, secret_key)

    # Build the payment URL (GET form redirect URL for QR)
    base_url = ESEWA_TEST_INITIATE if environment == "test" else ESEWA_LIVE_INITIATE

    # eSewa form POST payload
    form_data = {
        "amount":                    amount_str,
        "tax_amount":                "0",
        "total_amount":              amount_str,
        "transaction_uuid":          transaction_uuid,
        "product_code":              merchant_id,
        "product_service_charge":    "0",
        "product_delivery_charge":   "0",
        "success_url":               success_url,
        "failure_url":               failure_url,
        "signed_field_names":        "total_amount,transaction_uuid,product_code",
        "signature":                 signature,
    }

    # Build payment URL for QR (the URL the eSewa app will open)
    payment_url = (
        f"{base_url}"
        f"?amount={amount_str}"
        f"&tax_amount=0"
        f"&total_amount={amount_str}"
        f"&transaction_uuid={transaction_uuid}"
        f"&product_code={merchant_id}"
        f"&product_service_charge=0"
        f"&product_delivery_charge=0"
        f"&success_url={success_url}"
        f"&failure_url={failure_url}"
        f"&signed_field_names=total_amount,transaction_uuid,product_code"
        f"&signature={signature}"
    )

    # Generate QR code image from payment_url
    qr_image_base64 = qr_to_base64(payment_url)

    # Save transaction to DB
    try:
        from hotel.models import ManageBookings, EsewaTransaction
        booking = ManageBookings.objects.get(id=booking_id)
        EsewaTransaction.objects.create(
            booking=booking,
            transaction_uuid=transaction_uuid,
            product_code=merchant_id,
            amount=amount_str,
            status="initiated"
        )
    except Exception as e:
        print(f"Error saving transaction: {e}")

    return Response({
        "transaction_uuid":  transaction_uuid,
        "qr_image_base64":   qr_image_base64,   # base64 PNG for frontend <img>
        "payment_url":       payment_url,
        "form_data":         form_data,
        "base_url":          base_url,
        "message":           "QR generated. User should scan to pay.",
    })


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/payments/esewa/verify/
# Called after user claims they've paid
# Body: { transaction_uuid, booking_id, amount, environment }
# Returns: { status: "COMPLETE" | "PENDING" | "FAILED", ... }
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def esewa_verify(request):
    data             = request.data
    transaction_uuid = data.get("transaction_uuid")
    booking_id       = data.get("booking_id")
    amount           = data.get("amount")
    environment      = data.get("environment", "test")

    if not transaction_uuid:
        return Response({"message": "transaction_uuid required"}, status=status.HTTP_400_BAD_REQUEST)

    verify_url = ESEWA_TEST_VERIFY if environment == "test" else ESEWA_LIVE_VERIFY

    # eSewa v2 verification: GET with params
    params = {
        "product_code":     getattr(settings, "ESEWA_MERCHANT_ID", "EPAYTEST"),
        "total_amount":     str(float(amount)) if amount else "",
        "transaction_uuid": transaction_uuid,
    }

    try:
        resp = requests.get(verify_url, params=params, timeout=15)
        resp.raise_for_status()
        esewa_data = resp.json()
        txn_status = esewa_data.get("status", "UNKNOWN")

        # Update transaction status
        try:
            from hotel.models import EsewaTransaction
            transaction = EsewaTransaction.objects.get(transaction_uuid=transaction_uuid)
            transaction.status = "completed" if txn_status == "COMPLETE" else "failed"
            transaction.save()
        except Exception as e:
            print(f"Error updating transaction: {e}")

        return Response({
            "status":     txn_status,
            "esewa_data": esewa_data,
        })

    except requests.exceptions.HTTPError as e:
        error_body = {}
        try:
            error_body = e.response.json()
        except Exception:
            error_body = {"raw": e.response.text if e.response else str(e)}
        return Response({"message": error_body, "status": "FAILED"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"message": str(e), "status": "FAILED"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# GET /payments/<bookingId>/esewa/verify/  (eSewa redirects here on success)
# This is the return_url that eSewa opens in browser after payment
# ─────────────────────────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])  # ← CHANGE from IsAuthenticated to AllowAny
def esewa_redirect_success(request, booking_id):
    """
    eSewa redirects to this URL after successful payment.
    Query params include: transaction_uuid, product_code, total_amount,
                          status, signed_field_names, signature
    """
    transaction_uuid = request.GET.get("transaction_uuid")
    txn_status       = request.GET.get("status")
    total_amount     = request.GET.get("total_amount")

    # Update transaction and booking payment status
    if txn_status == "COMPLETE":
        try:
            from hotel.models import EsewaTransaction, ManageBookings, ManagePayments
            
            transaction = EsewaTransaction.objects.get(transaction_uuid=transaction_uuid)
            transaction.status = "completed"
            transaction.save()
            
            booking = ManageBookings.objects.get(id=booking_id)
            
            # Record the payment in ManagePayments
            ManagePayments.objects.create(
                booking=booking,
                name=booking.name,
                service="eSewa Payment",
                description=f"Online payment via eSewa - {transaction_uuid}",
                amount=total_amount or transaction.amount,
                date=timezone.now()
            )
            
        except Exception as e:
            print(f"Error updating payment: {e}")

    # Return simple HTML that redirects to frontend verification page
    from django.http import HttpResponse
    return HttpResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>eSewa Payment Redirect</title>
        <style>
            body {{
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: Arial, sans-serif;
                background: #f5f5f5;
                margin: 0;
            }}
            .container {{
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .success {{ color: #10b981; }}
            .failed {{ color: #ef4444; }}
            .spinner {{
                border: 3px solid #f3f3f3;
                border-top: 3px solid #10b981;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
        <script>
            setTimeout(function() {{
                window.location.href = '/payments/{booking_id}/esewa/verify/?transaction_uuid={transaction_uuid}&status={txn_status}&total_amount={total_amount}';
            }}, 3000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1 class="{txn_status == 'COMPLETE' and 'success' or 'failed'}">
                {txn_status == 'COMPLETE' and '✓ Payment Successful!' or '✗ Payment Failed'}
            </h1>
            <p>Amount: Rs. {total_amount}</p>
            <p>Transaction ID: {transaction_uuid}</p>
            <div class="spinner"></div>
            <p>Redirecting to verification page...</p>
        </div>
    </body>
    </html>
    """)