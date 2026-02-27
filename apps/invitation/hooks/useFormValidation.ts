'use client';

import { useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

/** A single field rule: the field key + an optional custom message. */
export interface FieldRule<T extends object> {
    /** Field key in the form state object */
    field: keyof T;
    /** Human-readable label shown in error messages */
    label: string;
    /** Optional custom validation function. Return error string or null. */
    validate?: (value: any, form: T) => string | null;
}

/** Map of field → error message string (undefined = no error). */
export type FormErrors<T extends object> = Partial<Record<keyof T, string>>;

// ────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────

/**
 * useFormValidation — reusable form validation hook.
 *
 * Usage:
 *   const { errors, validate, clearError, clearAll } = useFormValidation(rules, form);
 *
 *   // In handleSave:
 *   if (!validate()) return; // aborts if any rule fails
 *
 *   // In JSX:
 *   <FormField label="Nama" error={errors.bride_name}>
 *     <TextInput error={!!errors.bride_name} ... />
 *   </FormField>
 */
export function useFormValidation<T extends object>(
    rules: FieldRule<T>[],
    form: T,
) {
    const [errors, setErrors] = useState<FormErrors<T>>({});

    /**
     * Run all rules against the current form state.
     * Returns true if all pass, false if any fail.
     * Also updates the `errors` map.
     */
    const validate = useCallback((): boolean => {
        const next: FormErrors<T> = {};

        for (const rule of rules) {
            const value = form[rule.field];

            // Built-in: empty string / null / undefined → required
            const isEmpty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '');

            if (isEmpty) {
                next[rule.field] = `${rule.label} wajib diisi`;
                continue;
            }

            // Custom validator (if any)
            if (rule.validate) {
                const msg = rule.validate(value, form);
                if (msg) {
                    next[rule.field] = msg;
                }
            }
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    }, [rules, form]);

    /** Clear the error for a specific field (call onChange to clear on fix). */
    const clearError = useCallback((field: keyof T) => {
        setErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    /** Clear ALL errors. */
    const clearAll = useCallback(() => setErrors({}), []);

    return { errors, validate, clearError, clearAll };
}
