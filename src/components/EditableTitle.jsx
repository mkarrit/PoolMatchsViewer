import React, { useEffect, useRef, useState } from "react";

function IconPencil(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconX(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function EditableTitle({ storageKey = "tv_title", defaultTitle = "Matches en cours",
  storageSubKey = "tv_subtitle", defaultSubtitle = "BlackBall TD n°x Gironde - 2025/2026" }) {
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);

  const [editing, setEditing] = useState({ title: false, subtitle: false });
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    try {
      const storedTitle = localStorage.getItem(storageKey);
      const storedSub = localStorage.getItem(storageSubKey);
      if (storedTitle) setTitle(storedTitle);
      if (storedSub) setSubtitle(storedSub);
    } catch (e) {
      // ignore localStorage errors
    }
  }, [storageKey, storageSubKey]);

  useEffect(() => {
    if (editing.title && titleRef.current) titleRef.current.focus();
  }, [editing.title]);

  useEffect(() => {
    if (editing.subtitle && subtitleRef.current) subtitleRef.current.focus();
  }, [editing.subtitle]);

  function saveField(field) {
    try {
      if (field === "title") {
        localStorage.setItem(storageKey, title);
        setEditing((s) => ({ ...s, title: false }));
      } else {
        localStorage.setItem(storageSubKey, subtitle);
        setEditing((s) => ({ ...s, subtitle: false }));
      }
    } catch (e) {
      setEditing({ title: false, subtitle: false });
    }
  }

  function cancelField(field) {
    try {
      if (field === "title") {
        const stored = localStorage.getItem(storageKey);
        setTitle(stored || defaultTitle);
        setEditing((s) => ({ ...s, title: false }));
      } else {
        const stored = localStorage.getItem(storageSubKey);
        setSubtitle(stored || defaultSubtitle);
        setEditing((s) => ({ ...s, subtitle: false }));
      }
    } catch (e) {
      setEditing({ title: false, subtitle: false });
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {editing.title ? (
          <div className="flex items-center gap-2 w-full">
            <input ref={titleRef} className="input input-sm flex-1 px-2 py-1 rounded-md bg-white/5 text-lg font-black" value={title}
              onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveField("title"); if (e.key === "Escape") cancelField("title"); }} />
            <button className="text-accent p-1" onClick={() => saveField("title")} aria-label="Save title"><IconCheck className="w-5 h-5" /></button>
            <button className="text-text-muted p-1" onClick={() => cancelField("title")} aria-label="Cancel"><IconX className="w-5 h-5" /></button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">{title}</h1>
            <button title="Editer le titre" className="text-text-muted hover:text-accent p-1" onClick={() => setEditing((s) => ({ ...s, title: true }))}>
              <IconPencil className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="mt-1 flex items-center gap-3">
        {editing.subtitle ? (
          <div className="flex items-center gap-2 w-full">
            <input ref={subtitleRef} className="input input-xs flex-1 px-2 py-1 rounded-md bg-white/5 text-sm font-semibold" value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveField("subtitle"); if (e.key === "Escape") cancelField("subtitle"); }} />
            <button className="text-accent p-1" onClick={() => saveField("subtitle")} aria-label="Save subtitle"><IconCheck className="w-4 h-4" /></button>
            <button className="text-text-muted p-1" onClick={() => cancelField("subtitle")} aria-label="Cancel"><IconX className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <p className="text-accent font-semibold tracking-wide text-sm">{subtitle}</p>
            <button title="Editer le sous-titre" className="text-text-muted hover:text-accent p-1" onClick={() => setEditing((s) => ({ ...s, subtitle: true }))}>
              <IconPencil className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
