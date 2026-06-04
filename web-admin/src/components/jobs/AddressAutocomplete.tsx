'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchAddress } from '@/lib/api';
import { AddressSuggestion } from '@/types';

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (suggestion: AddressSuggestion) => void;
    placeholder?: string;
    error?: string;
}

export default function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Enter address...',
    error,
}: AddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await searchAddress(value);
                setSuggestions(results);
                setIsOpen(true);
            } catch (err) {
                console.error('Address search error:', err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [value]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (suggestion: AddressSuggestion) => {
        onChange(suggestion.address);
        onSelect(suggestion);
        setIsOpen(false);
        setSuggestions([]);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={`h-11 w-full rounded-xl border bg-surface pl-10 pr-10 text-sm text-ink-900 transition-colors focus:outline-none focus:ring-4 ${error
                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                            : 'border-ink-200 focus:border-brand-400 focus:ring-brand-500/10'
                        }`}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-ink-400" />
                )}
            </div>

            {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1.5 max-h-60 w-full animate-fade-in overflow-auto rounded-xl border border-ink-200 bg-surface py-1 shadow-lg">
                    {suggestions.map((suggestion) => (
                        <li
                            key={suggestion.id}
                            onClick={() => handleSelect(suggestion)}
                            className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-brand-50"
                        >
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                            <span className="text-sm text-ink-700">{suggestion.address}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}