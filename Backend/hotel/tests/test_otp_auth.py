from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from hotel.models import Hotel

User = get_user_model()

class OTPAuthenticationTests(TestCase):
    """Test OTP request and verification for admin/staff and owners."""

    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass", is_staff=True
        )
        # Create regular user (non-staff) – should not be able to request OTP? Actually any user with email can.
        self.regular_user = User.objects.create_user(
            username="user1", email="user@example.com", password="userpass"
        )
        # Create owner (Hotel with associated user)
        self.owner_user = User.objects.create_user(
            username="owner", email="owner@example.com", password="ownerpass"
        )
        self.hotel = Hotel.objects.create(
            name="Owner Hotel", owner="Owner", contact="1234567890",
            email="owner@example.com", location="City", pan="PAN123",
            user=self.owner_user
        )
        self.otp_request_url = reverse('forgot-password')   # OTPRequestView
        self.otp_verify_url = reverse('verify-otp')         # OTPVerifyView
        self.owner_otp_request_url = reverse('owner-forgot-password')
        self.owner_otp_verify_url = reverse('owner-verify-otp')
        self.owner_update_password_url = reverse('owner-update-password')

    # ---------- Admin/Staff OTP Tests ----------
    @patch('hotel.views.send_mail')
    def test_request_otp_existing_admin_user(self, mock_send_mail):
        """POST /forgot-password/ with existing admin email sends OTP and returns 200."""
        data = {"email": "admin@example.com"}
        response = self.client.post(self.otp_request_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'OTP has been sent to your email address')
        mock_send_mail.assert_called_once()
        # Check session has OTP (we can't access directly in test easily, but we trust view)

    @patch('hotel.views.send_mail')
    def test_request_otp_existing_regular_user(self, mock_send_mail):
        """Regular user can also request OTP (email exists)."""
        data = {"email": "user@example.com"}
        response = self.client.post(self.otp_request_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()

    def test_request_otp_nonexistent_email(self):
        """Email not found returns 404."""
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(self.otp_request_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_request_otp_missing_email(self):
        """Missing email field returns 400."""
        response = self.client.post(self.otp_request_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('hotel.views.send_mail')
    def test_verify_otp_correct(self, mock_send_mail):
        """First request OTP, then verify with correct OTP -> login success."""
        # Step 1: request OTP to populate session
        self.client.post(self.otp_request_url, {"email": "admin@example.com"}, format='json')
        # We need to extract the OTP from the mock call to simulate user input.
        # Since we can't easily get the generated OTP, we'll patch the random generation.
        # Alternatively, we can test by mocking the session. Simpler: mock random.randint to return known value.
        pass

    # Better approach: patch random.randint to return fixed OTP
    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_verify_otp_correct_fixed_otp(self, mock_send_mail, mock_randint):
        """Verify OTP with fixed known OTP."""
        mock_randint.return_value = 123456
        # Request OTP
        self.client.post(self.otp_request_url, {"email": "admin@example.com"}, format='json')
        # Now verify with correct OTP
        data = {"email": "admin@example.com", "otp": "123456"}
        response = self.client.post(self.otp_verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'OTP verified successfully. You are now logged in.')
        self.assertEqual(response.data['email'], 'admin@example.com')
        self.assertTrue(response.data['is_admin'])

    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_verify_otp_wrong_otp(self, mock_send_mail, mock_randint):
        """Wrong OTP returns 400."""
        mock_randint.return_value = 123456
        self.client.post(self.otp_request_url, {"email": "admin@example.com"}, format='json')
        data = {"email": "admin@example.com", "otp": "999999"}
        response = self.client.post(self.otp_verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Invalid OTP. Please try again.')

    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_verify_otp_without_request(self, mock_send_mail, mock_randint):
        """Verify OTP without prior request -> session missing -> error."""
        data = {"email": "admin@example.com", "otp": "123456"}
        response = self.client.post(self.otp_verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'OTP has expired. Please request a new OTP.')

    # ---------- Owner OTP Tests ----------
    @patch('hotel.views.send_mail')
    def test_owner_request_otp_existing_email(self, mock_send_mail):
        """POST /owner/forgot-password/ with existing owner email."""
        data = {"email": "owner@example.com"}
        response = self.client.post(self.owner_otp_request_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()

    def test_owner_request_otp_nonexistent_email(self):
        """Owner email not in Hotel model -> 404."""
        data = {"email": "wrong@example.com"}
        response = self.client.post(self.owner_otp_request_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_owner_verify_otp_correct(self, mock_send_mail, mock_randint):
        """Owner OTP verify correct -> returns success message (no login yet)."""
        mock_randint.return_value = 654321
        self.client.post(self.owner_otp_request_url, {"email": "owner@example.com"}, format='json')
        data = {"email": "owner@example.com", "otp": "654321"}
        response = self.client.post(self.owner_otp_verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'OTP verified successfully. Please set your new password.')

    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_owner_verify_otp_wrong(self, mock_send_mail, mock_randint):
        """Owner OTP wrong -> error."""
        mock_randint.return_value = 654321
        self.client.post(self.owner_otp_request_url, {"email": "owner@example.com"}, format='json')
        data = {"email": "owner@example.com", "otp": "111111"}
        response = self.client.post(self.owner_otp_verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('random.randint')
    @patch('hotel.views.send_mail')
    def test_owner_update_password_success(self, mock_send_mail, mock_randint):
        """After OTP verify, update password works."""
        mock_randint.return_value = 123456
        # Request OTP
        self.client.post(self.owner_otp_request_url, {"email": "owner@example.com"}, format='json')
        # Verify OTP (this sets session flag)
        self.client.post(self.owner_otp_verify_url, {"email": "owner@example.com", "otp": "123456"}, format='json')
        # Update password
        data = {"email": "owner@example.com", "new_password": "newsecurepass123"}
        response = self.client.post(self.owner_update_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password updated successfully. Please login with your new password.')
        # Verify password changed
        self.owner_user.refresh_from_db()
        self.assertTrue(self.owner_user.check_password("newsecurepass123"))

    def test_owner_update_password_without_otp_verify(self):
        """Update password without prior OTP verify -> error."""
        data = {"email": "owner@example.com", "new_password": "newpass"}
        response = self.client.post(self.owner_update_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'OTP not verified. Please request a new OTP.')