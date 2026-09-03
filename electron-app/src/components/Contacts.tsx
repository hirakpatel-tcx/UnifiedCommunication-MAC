import React, { useState } from 'react';
import { Search, Phone, MessageSquare, Pencil, UserPlus, Trash2, Building, X, Plus } from 'lucide-react';
import { Contact, ContactNumber } from '../types/pjsip';

interface ContactsProps {
  contacts: Contact[];
  onCall: (destination: string) => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onUpdateContact?: (id: string, updates: Omit<Contact, 'id'>) => void;
  onMessage?: (destination: string) => void;
  messagingEnabled?: boolean;
}

const NUMBER_LABELS = ['Mobile', 'Work', 'Home', 'Fax', 'Other'];
const emptyNumber = (): ContactNumber => ({ label: 'Mobile', number: '' });

export const Contacts: React.FC<ContactsProps> = ({
  contacts,
  onCall,
  onAddContact,
  onDeleteContact,
  onUpdateContact,
  onMessage,
  messagingEnabled = false,
}) => {
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [numbers, setNumbers] = useState<ContactNumber[]>([emptyNumber()]);
  const [company, setCompany] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setNumbers([emptyNumber()]);
    setCompany('');
    setEmail('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleStartEdit = (c: Contact) => {
    setEditingId(c.id);
    setFirstName(c.firstName || c.name.split(' ')[0] || '');
    setLastName(c.lastName || c.name.split(' ').slice(1).join(' ') || '');
    setNumbers(c.numbers && c.numbers.length > 0 ? c.numbers : [{ label: 'Mobile', number: c.number }]);
    setCompany(c.company || '');
    setEmail(c.email || '');
    setIsModalOpen(true);
  };

  const handleNumberChange = (index: number, field: 'label' | 'number', value: string) => {
    setNumbers((prev) => prev.map((n, i) => (i === index ? { ...n, [field]: value } : n)));
  };

  const handleAddNumberField = () => {
    setNumbers((prev) => [...prev, emptyNumber()]);
  };

  const handleRemoveNumberField = (index: number) => {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = numbers.filter((n) => n.number.trim());
    if (!firstName.trim() || validNumbers.length === 0) return;

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const payload: Omit<Contact, 'id'> = {
      name: fullName,
      number: validNumbers[0].number.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      numbers: validNumbers.map((n) => ({ label: n.label, number: n.number.trim() })),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
    };

    if (editingId && onUpdateContact) {
      onUpdateContact(editingId, payload);
    } else {
      onAddContact(payload);
    }
    resetForm();
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 select-none animate-fadeIn rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Directory</h2>
        </div>

        <button
          onClick={handleStartAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, department, or extension..."
          className="glass-input w-full pl-8 pr-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
        />
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
            No contacts found.
          </p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="group flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>{c.number}</span>
                    {c.company && (
                      <>
                        <span>•</span>
                        <span className="font-sans flex items-center gap-1">
                          <Building className="w-3 h-3" /> {c.company}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onCall(c.number)}
                  title={`Call ${c.name}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
                {messagingEnabled && (
                  <button
                    onClick={() => onMessage?.(c.number)}
                    title={`Message ${c.name}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleStartEdit(c)}
                  title={`Edit ${c.name}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteContact(c.id)}
                  title="Delete Contact"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl p-4 animate-fadeIn"
          onClick={resetForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-popIn overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Contact' : 'Add Contact'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="glass-input px-3 py-1.5 rounded-xl text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="glass-input px-3 py-1.5 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Contact Numbers */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contact Number(s) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNumberField}
                    className="flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add number
                  </button>
                </div>

                {numbers.map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <select
                      value={n.label}
                      onChange={(e) => handleNumberChange(i, 'label', e.target.value)}
                      className="glass-input px-2 py-1.5 rounded-xl text-xs outline-none w-24 shrink-0"
                    >
                      {NUMBER_LABELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required={i === 0}
                      placeholder="Number *"
                      value={n.number}
                      onChange={(e) => handleNumberChange(i, 'number', e.target.value)}
                      className="glass-input flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none font-mono"
                    />
                    {numbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNumberField(i)}
                        title="Remove number"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <input
                type="text"
                placeholder="Company / Dept"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="glass-input w-full px-3 py-1.5 rounded-xl text-xs outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-3 py-1.5 rounded-xl text-xs outline-none"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
