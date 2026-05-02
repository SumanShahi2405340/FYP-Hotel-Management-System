from django.test import TestCase
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from hotel.models import Hotel, Receptionist
from playwright.sync_api import sync_playwright

User = get_user_model()

class UIFunctionalTests(StaticLiveServerTestCase):
    """End‑to‑end UI tests simulating real user actions (runs with manage.py test)."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)  # Set False to watch
        cls.page = cls.browser.new_page()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        super().tearDownClass()

    def setUp(self):
        # Create test data
        self.owner_user = User.objects.create_user(
            username='owner', email='owner@test.com', password='ownerpass'
        )
        self.hotel = Hotel.objects.create(
            name='UI Test Hotel', owner='Owner', contact='1234567890',
            email='owner@test.com', location='City', pan='PAN123',
            user=self.owner_user, status='Active'
        )
        # Receptionist (assuming relation exists)
        self.receptionist = Receptionist.objects.create(
            hotel=self.hotel, name='Recep', email='recep@test.com',
            contact='111111', user=self.owner_user  # adjust if needed
        )

    def test_owner_login_and_see_dashboard(self):
        """Simulate owner login and verify dashboard loads."""
        self.page.goto(f'{self.live_server_url}/owner/login/')
        self.page.fill('input[name="email"]', 'owner@test.com')
        self.page.fill('input[name="password"]', 'ownerpass')
        self.page.click('button[type="submit"]')
        # Wait for dashboard to appear
        self.page.wait_for_selector('.dashboard', timeout=5000)
        assert self.hotel.name in self.page.content()