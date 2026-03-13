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
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-sm focus:outline-none focus:ring-2 ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
                )}
            </div>

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {suggestions.map((suggestion) => (
                        <li
                            key={suggestion.id}
                            onClick={() => handleSelect(suggestion)}
                            className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50"
                        >
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            <span className="text-sm text-slate-700">{suggestion.address}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}