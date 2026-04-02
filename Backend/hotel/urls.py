from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel.payments import esewa_views
# from . import views
from .views import (
    # Auth-related views
    AdminLoginView,
    OTPRequestView,
    OTPVerifyView,
    HotelViewSet,

    # Hotel management views
    RegisterHotelView,
    ListHotelsView,
    ActivateHotelView,
    DeactivateHotelView,
    DeleteHotelView,
    HotelUpdateView,
    HotelProfileView,
    OwnerProfileView,

    # Commission rules view 
    CommissionRuleView,

    # Commission payments views 
    get_active_hotels, 
    confirm_payments,

    # Track Commission Revenue view 
    track_commission_revenue,

    # Admin Send Announcement view 
    send_announcement,
    # Admin recent announcement view
    recent_announcements,
    
    # Owner Send Announcement view  
    owner_send_announcement,
    owner_recent_announcements,

    # OwnerLoginView,

    # Starred notifications views
    OwnerStarredNotificationList,
    OwnerStarredNotificationCreate,
    OwnerStarredNotificationDelete,
    RoomInventoryView,
    RoomPriceView,
    me,
    ManageMaintenanceRequestListCreateView,
    ManageMaintenanceRequestDetailView,
    register_receptionist,
    get_hotel_receptionist,
    get_hotel_receptionist_info,
    get_hotel_staff_info, 
    add_staff,
    delete_staff,
    PromotionListCreateView,
    PromotionDetailView,
    CommissionReportListCreateView,
    ManageBookingsViewSet, 
    AttendanceViewSet,
    ManagePaymentsViewSet,
      
  
)

# Router for DRF ViewSets
router = DefaultRouter()
router.register(r'hotels', HotelViewSet)
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'manage-bookings', ManageBookingsViewSet)
router.register(r'manage-payments', ManagePaymentsViewSet)



urlpatterns = [
    # Authentication endpoints
    path('admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('forgot-password/', OTPRequestView.as_view(), name='forgot-password'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),

    # Hotel management endpoints
    path("hotels/<int:pk>/", DeleteHotelView.as_view()),  
    path("hotels/register", RegisterHotelView.as_view(), name="register-hotel"),
    path("hotels", ListHotelsView.as_view(), name="list-hotels"),
    path("hotels/<int:pk>/activate", ActivateHotelView.as_view(), name="activate-hotel"),
    path("hotels/<int:pk>/deactivate", DeactivateHotelView.as_view(), name="deactivate-hotel"),
    path("hotels/<int:pk>/update/", HotelUpdateView.as_view(), name="hotel-update"),
    path("hotels/<int:pk>/hprofile/", HotelProfileView.as_view(), name="hotel-profile"),
    path("hotels/<int:pk>/oprofile/", OwnerProfileView.as_view(), name="owner-profile"),

    # Commission rules endpoint 
    path("commission-rules/", CommissionRuleView.as_view(), name="commission-rules"),

    # Commission payments endpoints 
    path("commission-payments/active-hotels/", get_active_hotels, name="active-hotels"), 
    path("commission-payments/confirm/", confirm_payments, name="confirm-payments"),
    
    # Track Commission Revenue endpoint 
    path("commission-revenue/", track_commission_revenue, name="commission-revenue"),

    # Send Announcement from Admin endpoint 
    path("send-announcement/", send_announcement, name="send-announcement"),

    # View Recent Announcement from Admin endpoint
    path("recent-announcements/", recent_announcements, name="recent-announcements"),

     # Send Announcement from Owner endpoint
    path("owner-send-announcement/", owner_send_announcement, name="owner-send-announcement"),  # Owner → Admin/Receptionist 
     
    # View Recent Announcement from Owner endpoint
    path("owner-recent-announcements/", owner_recent_announcements, name="owner-recent-announcements"),


    # Owner Authentication endpoints
    path('owner/register/', RegisterHotelView.as_view(), name='owner-register'),
    # path('owner/login/', OwnerLoginView.as_view(), name='owner-login'),
    

    # Starred Notifications endpoints
    path('starred-notifications/', OwnerStarredNotificationList.as_view(), name='owner-starred-list'),
    path('star-notification/', OwnerStarredNotificationCreate.as_view(), name='owner-star-create'),
    path('star-notification/<int:pk>/', OwnerStarredNotificationDelete.as_view(), name='owner-star-delete'),

    # Room Management API endpoints
    path("room-inventory/", RoomInventoryView.as_view(), name="room-inventory"),
    path("room-price/", RoomPriceView.as_view(), name="room-price"),
    # hotel info api (contains hotel_id and hotel_name retirved from token)
    path("me/", me, name='me'),

    # Maintenance Request Endpoint
    path("requests/", ManageMaintenanceRequestListCreateView.as_view(), name="requests_list_create"),
    path("requests/<int:pk>/", ManageMaintenanceRequestDetailView.as_view(), name="request_detail"),

    path("receptionist/register/", register_receptionist, name="register_receptionist"),
    path("hotel/receptionist/", get_hotel_receptionist, name="get_hotel_receptionist"),
    path("hotel/receptionist-info/", get_hotel_receptionist_info, name="get_hotel_receptionist_info_managestaffnattedance"),


    path("hotel/staff-info/", get_hotel_staff_info, name="get_hotel_staff_info_managestaffnnattendance"),
    path("hotel/add-staff/", add_staff, name="add_staff"),
    path("staff/<int:pk>/delete/", delete_staff, name="delete_staff"),


    # Promotion endpoints
    path("promotions/", PromotionListCreateView.as_view(), name="promotion-list-create"),
    path("promotions/<int:pk>/", PromotionDetailView.as_view(), name="promotion-detail"),

    path("commission-reports/", CommissionReportListCreateView.as_view(), name="commission-reports"),

    # Esewa payment endpoints
    path('payments/esewa/initiate/', esewa_views.esewa_initiate, name='esewa-initiate'),
    path('payments/esewa/verify/', esewa_views.esewa_verify, name='esewa-verify'),
    path('payments/<int:booking_id>/esewa/verify/', esewa_views.esewa_redirect_success, name='esewa-redirect-success'),




    # Include router URLs (for HotelViewSet+ ManageBookingsViewSet)
    path('', include(router.urls)),

   

]







