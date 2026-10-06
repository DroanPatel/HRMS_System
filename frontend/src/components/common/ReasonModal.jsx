import { useEffect, useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

// Small popup that asks for a required text reason (used when rejecting leave).
export default function ReasonModal({ open, onClose, onSubmit, loading, title, label = "Reason", confirmLabel = "Submit" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    onSubmit(text.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form className="space-y-4" onSubmit={submit}>
        <Input label={label} required value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={loading}>{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
