# Bank Assistant Chatbot

A Django-based **Bank Assistant Chatbot** using the **Retrieval-Augmented Generation (RAG)** approach to provide personalized responses based on uploaded PDF documents. The application supports user registration, authentication, PDF uploads, and querying a vector database for context-aware answers. Admins have extended privileges to upload and query on behalf of other users.

## Features

- **User Authentication**: Register, log in, and log out securely.
- **PDF Upload**: Users can upload PDF documents, which are processed and embedded into a vector database for retrieval.
- **User Priviliges**: Users can ask questions, and the chatbot retrieves relevant information from their uploaded PDFs using the RAG approach.
- **Admin Privileges**: Admins can:
  - Upload PDFs for any user.
  - Query the vector database of any user.
  - View a list of all users and their associated PDFs.
- **Vector Database**: Stores embeddings of PDF content for efficient retrieval during query processing.
- **RESTful API**: JSON-based endpoints for seamless interaction.

---

##  Demo

![Demo](demo/bank_asst_gif.gif)

> _A walkthrough of a project Bank Assistant Chatbot using RAG to deliver personalized responses from uploaded PDFs, with user authentication, PDF handling, and admin-level controls._

---

## Tech Stack

- **Backend**: Django (Python)
- **Database**: Django ORM (default SQLite or configurable for PostgreSQL/MySQL)
- **Authentication**: Django's built-in authentication system
- **File Handling**: PDF uploads stored on the server
- **RAG Approach**: Custom utilities (`embed_pdf_and_store`, `query_user`) for embedding PDFs and querying the vector database
- **API**: Django views with JSON responses
- **Security**: CSRF protection and login-required decorators

## Project Structure

```
bank-rag/
├── manage.py
├── bank_assistant/
│   ├── __init__.py
│   ├── models.py           # PDFDocument and UserVectorDB models
│   ├── utils.py            # RAG-related functions (embed_pdf_and_store, query_user)
│   ├── views.py            # API endpoints (provided code)
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   └── tests/
│   └── urls.py/
├── media/                  # Stores uploaded PDF files
├── static/
├── settings.py/
├── urls.py/
├── templates/
├── requirements.txt
└── README.md
```

## Installation

### Prerequisites

- Python 3.11+
- Django 5.x
- A vector database or embedding library (e.g., FAISS, Pinecone, or equivalent)
- Dependencies for PDF processing and embeddings (e.g., `PyPDF2`, `sentence-transformers`)

### Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/bank-assistant-chatbot.git
   cd bank-assistant-chatbot
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Django Settings**
   - Update `settings.py` to configure:
     - Database (default: SQLite, or configure PostgreSQL/MySQL)
     - `MEDIA_ROOT` and `MEDIA_URL` for PDF uploads
     - Any vector database credentials or settings
   ```python
   # settings.py
   MEDIA_URL = '/media/'
   MEDIA_ROOT = BASE_DIR / 'media'
   ```

5. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a Superuser (Admin)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Development Server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

All endpoints are JSON-based and accessible via HTTP POST requests.

| Endpoint                     | Description                              | Authentication | Admin Only |
|------------------------------|------------------------------------------|----------------|------------|
| `/register/`                 | Register a new user                     | None           | No         |
| `/login/`                    | Log in and create/get vector DB         | None           | No         |
| `/logout/`                   | Log out the current user                | Required       | No         |
| `/upload_pdf/`               | Upload a PDF for the user or target user | Required       | Admin can specify `user_id` |
| `/query/`                    | Query the vector DB for answers         | Required       | Admin can specify `user_id` |
| `/list_users_with_pdfs/`     | List all users and their PDFs           | Required       | Yes        |


## Usage

1. **User Workflow**
   - Register and log in to create a user account and initialize a vector database.
   - Upload banking-related PDFs (e.g., loan agreements, account statements) for that user.
   - Ask questions about the uploaded documents, and the chatbot will retrieve relevant information using RAG.

2. **Admin Workflow**
   - Log in as an admin (superuser).
   - Upload PDFs for any user by specifying their `user_id`.
   - Query any user's vector database by specifying their `user_id`.
   - View all users and their uploaded PDFs via `/list_users_with_pdfs/`.

## RAG Approach

- **PDF Embedding**: The `embed_pdf_and_store` function processes uploaded PDFs, extracts text, and generates embeddings stored in vector databases (`user_dbs`).
- **Query Processing**: The `query_user` function retrieves relevant document chunks from the vector database based on the user's question and generates a context-aware response.

## Security Considerations

- **CSRF Protection**: Enabled for all views except where explicitly exempted (`@csrf_exempt`).
- **Authentication**: Login is required for sensitive operations (`upload_pdf`, `query`, `logout`, `list_users_with_pdfs`).
- **Admin Privileges**: Restricted to users with `is_staff=True`.
- **File Handling**: Ensure `MEDIA_ROOT` is secure and PDFs are validated to prevent malicious uploads.

## Future Improvements

- Add support for other document formats (e.g., DOCX, TXT).
- Implement rate limiting for API endpoints.
- Support batch PDF uploads and multi-user querying.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for bugs, features, or improvements.
