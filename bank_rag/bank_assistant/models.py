from django.contrib.auth.models import User
from django.db import models

class PDFDocument(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pdfs")
    file = models.FileField(upload_to="pdfs/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

class UserVectorDB(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE)
    db_path = models.CharField(max_length=255)  # location of FAISS index
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VectorDB for {self.owner.username}"
