"use client";

import React, { useState, useEffect } from 'react';

interface TableField {
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'password';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  tableName: string;
  fields: TableField[];
  initialData?: any;
  loading?: boolean;
  allowDelete?: boolean;
}

const CrudModal: React.FC<CrudModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  tableName,
  fields,
  initialData = {},
  loading = false,
  allowDelete = true
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = initialData && initialData.id;

  useEffect(() => {
    if (isOpen) {
      const initialFormData: any = {};
      fields.forEach(field => {
        // Handle null/undefined values by setting to empty string
        const value = initialData[field.name];
        initialFormData[field.name] = value !== null && value !== undefined ? value : '';
      });
      setFormData(initialFormData);
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData, fields]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      // Only validate required fields that are actually in the form
      if (field.required) {
        const value = formData[field.name];
        // Check for empty string, null, or undefined
        if (value === '' || value === null || value === undefined) {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
      
      // Email validation
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
      
      // Number validation - allow empty for non-required fields
      if (field.type === 'number' && formData[field.name] && formData[field.name] !== '') {
        if (isNaN(Number(formData[field.name]))) {
          newErrors[field.name] = 'Please enter a valid number';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Process form data before saving - convert empty strings to null for non-required fields
      const processedData = { ...formData };
      fields.forEach(field => {
        if (!field.required && processedData[field.name] === '') {
          processedData[field.name] = null;
        }
      });
      
      await onSave(processedData);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initialData.id) return;
    
    try {
      await onDelete(initialData.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  const renderField = (field: TableField) => {
    const value = formData[field.name] || '';
    
    const commonProps = {
      id: field.name,
      name: field.name,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        handleInputChange(field.name, e.target.value),
      className: `input input-bordered w-full ${
        errors[field.name] ? 'input-error' : ''
      }`,
      required: field.required,
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`
    };

    switch (field.type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`textarea textarea-bordered w-full ${
              errors[field.name] ? 'textarea-error' : ''
            }`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            step={field.name.includes('price') || field.name.includes('percentage') ? '0.01' : '1'}
            min="0"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            {...commonProps}
          />
        );
      
      case 'password':
        return (
          <input
            type="password"
            {...commonProps}
            autoComplete="new-password"
          />
        );
      
      default:
        return (
          <input
            type={field.type}
            {...commonProps}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-base-300">
            <h2 className="text-xl font-semibold text-base-content">
              {isEditing ? 'Edit' : 'Add New'} {tableName}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="btn btn-sm btn-circle btn-ghost text-base-content hover:bg-base-300 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {fields.map(field => (
                <div key={field.name} className={`${
                  field.type === 'textarea' ? 'md:col-span-2' : ''
                }`}>
                  <label htmlFor={field.name} className="label">
                    <span className="label-text text-base-content">
                      {field.label}
                      {field.required && <span className="text-error ml-1">*</span>}
                    </span>
                  </label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="text-error text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-base-300">
              <div>
                {isEditing && allowDelete && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="btn btn-error btn-sm text-white"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Confirm Deletion
            </h3>
            <p className="text-base-content/70 mb-6">
              Are you sure you want to delete this {tableName.toLowerCase()}? This action cannot be undone.
            </p>
            
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-error text-white"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrudModal;