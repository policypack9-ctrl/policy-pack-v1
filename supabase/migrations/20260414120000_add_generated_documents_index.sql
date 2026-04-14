create index if not exists generated_documents_user_document_key_idx
  on public.generated_documents (user_id, document_key);