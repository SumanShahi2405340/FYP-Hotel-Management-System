from locust import HttpUser, task, between

class AdminUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def login(self):
        response = self.client.post(
            "/api/admin-login/",
            json={"email": "sumanjungshahi100@gmail.com", "password": "secret@123"}
        )
        if response.status_code == 200:
            print("Login successful")
        else:
            print("Login failed:", response.text)
