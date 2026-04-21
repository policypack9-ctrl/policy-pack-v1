"use client";

import { useState } from "react";

type PublishFormProps = {
  disabled?: boolean;
};

export default function LinkedInPublishForm({
  disabled = false,
}: PublishFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || isSubmitting) {
      return;
    }

    const trimmed = content.trim();

    if (!trimmed) {
      setError("Write the post text first.");
      setSuccess("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/linkedin/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        feedUrl?: string | null;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "LinkedIn publish failed.");
      }

      setSuccess(
        payload.feedUrl
          ? `Published successfully. Open post: ${payload.feedUrl}`
          : "Published successfully.",
      );
      setContent("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "LinkedIn publish failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-slate-200 p-5"
    >
      <p className="text-sm font-semibold text-slate-900">Publish a text post</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Start with text-only posts. We can add image posting next.
      </p>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write the LinkedIn post here..."
        className="mt-4 min-h-48 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
        disabled={disabled || isSubmitting}
        maxLength={3000}
      />

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
        <span>Max 3000 characters</span>
        <span>{content.length}/3000</span>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 break-words">
          {success}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Publishing..." : "Publish to LinkedIn"}
        </button>
      </div>
    </form>
  );
}
