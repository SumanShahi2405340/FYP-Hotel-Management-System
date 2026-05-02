from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from hotel.models import Hotel, RoomInventory, RoomPrice, ManageBookings, ManagePayments, Receptionist
from unittest.mock import patch
from datetime import datetime

User = get_user_model()

class HMSIntegrationTests(TestCase):
    """Integration tests for HMS - testing interaction between modules/APIs."""

    def setUp(self):
        self.client = APIClient()
        
        # Admin user
        self.admin = User.objects.create_user(
            username='admin', email='admin@hms.com', password='adminpass', is_staff=True
        )
        
        # Owner user and hotel
        self.owner_user = User.objects.create_user(
            username='owner', email='owner@test.com', password='ownerpass'
        )
        self.hotel = Hotel.objects.create(
            name='Integration Hotel', owner='Owner Name', contact='1234567890',
            email='owner@test.com', location='Downtown', pan='PAN123',
            user=self.owner_user, status='Active'
        )
        
        # Receptionist user
        self.recep_user = User.objects.create_user(
            username='recep', email='recep@test.com', password='recep123'
        )
        self.receptionist = Receptionist.objects.create(
            hotel=self.hotel, name='Recep Name', email='recep@test.com',
            contact='1111111111', user=self.recep_user
        )

    # ---------- Test 1: Admin login + hotel activation ----------
    def test_admin_login_and_activate_hotel(self):
        """Admin logs in, lists hotels, and activates an inactive hotel."""
        # Admin login
        login_url = reverse('admin-login')
        response = self.client.post(login_url, {'email': 'admin@hms.com', 'password': 'adminpass'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # List hotels
        list_url = reverse('list-hotels')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Deactivate then activate
        self.hotel.status = 'Inactive'
        self.hotel.save()
        activate_url = reverse('activate-hotel', kwargs={'pk': self.hotel.id})
        response = self.client.patch(activate_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, 'Active')

    # ---------- Test 2: Owner room inventory & price CRUD ----------
    def test_owner_room_management(self):
        """Owner creates/updates room inventory and prices (CRUD)."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Update room inventory (PUT)
        inventory_url = reverse('room-inventory')
        data = {'normal_rooms': 10, 'deluxe_rooms': 5, 'suite_rooms': 2}
        response = self.client.put(inventory_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inventory = RoomInventory.objects.get(hotel=self.hotel)
        self.assertEqual(inventory.normal_rooms, 10)
        self.assertEqual(inventory.deluxe_rooms, 5)
        self.assertEqual(inventory.suite_rooms, 2)
        
        # Update room prices (PUT)
        price_url = reverse('room-price')
        price_data = {'normal_price': 100.00, 'deluxe_price': 200.00, 'suite_price': 350.00}
        response = self.client.put(price_url, price_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = RoomPrice.objects.get(hotel=self.hotel)
        self.assertEqual(float(prices.normal_price), 100.00)
        self.assertEqual(float(prices.deluxe_price), 200.00)
        self.assertEqual(float(prices.suite_price), 350.00)
        
        # GET inventory to verify retrieval
        response = self.client.get(inventory_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['normal_rooms'], 10)

    # ---------- Test 3: Receptionist booking + payment creation ----------
    def test_receptionist_booking_and_payment_creation(self):
        """Receptionist creates a booking and adds a payment."""
        self.client.force_authenticate(user=self.recep_user)
        
        # Create a booking
        booking_url = reverse('managebookings-list')
        booking_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'contact': '9876543210',
            'room': 'Deluxe Suite',
            'days': 3,
            'checkin': '2025-01-10T12:00:00Z',
            'checkout': '2025-01-13T11:00:00Z'
        }
        response = self.client.post(booking_url, booking_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking_id = response.data['id']
        
        # Create a payment
        payments_url = reverse('managepayments-list')
        payment_data = {
            'booking': booking_id,
            'name': 'John Doe',
            'service': 'Room Booking',
            'description': '3 nights Deluxe Suite',
            'amount': 600.00
        }
        response = self.client.post(payments_url, payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify payment exists
        payment = ManagePayments.objects.get(booking_id=booking_id)
        self.assertEqual(float(payment.amount), 600.00)
        self.assertEqual(payment.service, 'Room Booking')

    # ---------- Test 4: Owner registers a new receptionist ----------
    @patch('hotel.views.send_mail')
    def test_owner_registers_receptionist(self, mock_send_mail):
        """Owner registers a new receptionist → user created → email sent."""
        self.client.force_authenticate(user=self.owner_user)
        
        register_url = reverse('register_receptionist')
        data = {
            'name': 'New Receptionist',
            'age': 28,
            'email': 'newrecep@test.com',
            'contact': '9998887777',
            'permanent_address': '123 Main St',
            'citizenship': 'CIT123456',
            'joined_date': '2025-01-01',
            'status': 'Active'
        }
        response = self.client.post(register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify receptionist created in DB
        self.assertTrue(Receptionist.objects.filter(email='newrecep@test.com').exists())
        # Verify associated User was created
        self.assertTrue(User.objects.filter(email='newrecep@test.com').exists())
        # Verify email sending was called
        mock_send_mail.assert_called_once()