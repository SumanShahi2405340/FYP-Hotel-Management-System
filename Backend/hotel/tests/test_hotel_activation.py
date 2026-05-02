from django.test import TestCase
from django.contrib.auth.models import User
from hotel.models import Hotel

class HotelActivationTests(TestCase):
    """Unit tests for Hotel.activate() and Hotel.deactivate() methods."""

    def setUp(self):
        # Create a test user and hotel with is_active=False (Inactive)
        self.user = User.objects.create_user(
            username="testowner",
            email="owner@test.com",
            password="testpass"
        )
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            owner="Test Owner",
            contact="1234567890",
            email="hotel@test.com",
            location="Test Location",
            pan="TESTPAN123",
            status="Inactive",   # initial state
            user=self.user
        )

    def test_activate_hotel(self):
        """Call hotel.activate() -> status becomes Active."""
        self.hotel.activate()
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, "Active")

    def test_deactivate_hotel(self):
        """Call hotel.deactivate() -> status becomes Inactive."""
        # First activate, then deactivate
        self.hotel.activate()
        self.assertEqual(self.hotel.status, "Active")
        self.hotel.deactivate()
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, "Inactive")

    def test_activate_already_active_hotel(self):
        """Activating an already active hotel should leave it Active."""
        self.hotel.activate()
        self.assertEqual(self.hotel.status, "Active")
        # Activate again
        self.hotel.activate()
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, "Active")   # remains Active

    def test_deactivate_already_inactive_hotel(self):
        """Deactivating an already inactive hotel should leave it Inactive."""
        self.hotel.deactivate()   # already Inactive
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, "Inactive")
        # Call again
        self.hotel.deactivate()
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.status, "Inactive")

    def test_toggle_status(self):
        """Toggle back and forth between Active and Inactive."""
        self.hotel.activate()
        self.assertEqual(self.hotel.status, "Active")
        self.hotel.deactivate()
        self.assertEqual(self.hotel.status, "Inactive")
        self.hotel.activate()
        self.assertEqual(self.hotel.status, "Active")