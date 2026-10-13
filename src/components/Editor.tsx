"use client";
import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  room: string;
  name: string;
  onSnapshot?: (html: string) => void;
  onReady?: (api: { getHTML: () => string }) => void; // <-- new optional prop
};

export default function CRDTEditor({ room, name, onSnapshot, onReady }: Props) {
  // Basic TipTap (your Yjs wiring can stay as-is if you previously had it)
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      // Snapshot hook stays the same
      onSnapshot?.(editor.getHTML());
    },
  });

  // Hand a tiny API back up to the page when ready
  useEffect(() => {
    if (!editor) return;
    onReady?.({ getHTML: () => editor.getHTML() }); // safe optional call
  }, [editor, onReady]);

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          className="px-3 py-1 rounded-xl border"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          className="px-3 py-1 rounded-xl border"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          className="px-3 py-1 rounded-xl border"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 min-h-[65vh]">
        <EditorContent editor={editor} className="min-h-[65vh]" />
      </div>
    </div>
  );
}