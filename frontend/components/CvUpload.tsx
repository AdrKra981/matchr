"use client";
import { useState } from "react";
import { uploadCv } from "@/lib/api";

interface Props {
    onUploaded: () => void;   // powiadom rodzica, że CV gotowe
}

export default function CvUpload({ onUploaded }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setStatus("");
        try {
            const res = await uploadCv(file);
            setStatus(`CV wgrane (${res.chars} znaków)`);
            onUploaded();
        } catch {
            setStatus("Błąd uploadu CV");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <input type="file" accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button disabled={!file || loading} onClick={handleUpload}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg">
                {loading ? "Wgrywam…" : "Dodaj CV"}
            </button>
            {status && <p className="text-sm">{status}</p>}
        </div>
    );
}