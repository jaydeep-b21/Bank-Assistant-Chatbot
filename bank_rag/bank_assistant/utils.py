import os
import json
import faiss
import numpy as np
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from django.conf import settings

from .models import UserVectorDB

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")


def _get_user_db(user):
    """Ensure FAISS index exists for the user, return index and DB path."""
    db_dir = os.path.join(settings.MEDIA_ROOT, f"user_dbs/{user.id}")
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "index.faiss")

    if not os.path.exists(db_path):
        dim = embedding_model.get_sentence_embedding_dimension()
        index = faiss.IndexFlatL2(dim)
        faiss.write_index(index, db_path)
        UserVectorDB.objects.update_or_create(owner=user, defaults={"db_path": db_path})

    index = faiss.read_index(db_path)
    return index, db_path


def _get_context_store_path(user):
    return os.path.join(settings.MEDIA_ROOT, f"user_dbs/{user.id}/chunks.json")


def embed_pdf_and_store(user, pdf_path):
    """Read a PDF, create embeddings, and store them with chunks."""
    index, db_path = _get_user_db(user)
    chunk_path = _get_context_store_path(user)

    # Extract text
    reader = PdfReader(pdf_path)
    chunks = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            for i in range(0, len(text), 500):
                chunks.append(text[i:i+500])

    if not chunks:
        return

    # Embed
    vectors = embedding_model.encode(chunks, convert_to_numpy=True)
    index.add(np.array(vectors, dtype="float32"))
    faiss.write_index(index, db_path)

    # Save chunks for retrieval
    existing_chunks = []
    if os.path.exists(chunk_path):
        with open(chunk_path, "r", encoding="utf-8") as f:
            existing_chunks = json.load(f)

    existing_chunks.extend(chunks)
    with open(chunk_path, "w", encoding="utf-8") as f:
        json.dump(existing_chunks, f, ensure_ascii=False, indent=2)


def query_user(user, question, top_k=3):
    """Query user's FAISS DB and use real context from chunks."""
    index, db_path = _get_user_db(user)
    chunk_path = _get_context_store_path(user)

    if not os.path.exists(chunk_path):
        return "No knowledge base found for this user."

    # Load stored text chunks
    with open(chunk_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    # Embed question
    q_vec = embedding_model.encode([question], convert_to_numpy=True).astype("float32")
    D, I = index.search(q_vec, top_k)

    # Get actual context from matched indices
    matched_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
    context = "\n\n".join(matched_chunks)

    # RAG prompt
    prompt = f"""
You are a helpful AI assistant for bank customers.
Answer the question based on the context below.

Context:
{context}

Question: {question}
"""

    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error from Gemini: {str(e)}"
