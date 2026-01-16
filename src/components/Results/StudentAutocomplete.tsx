import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../../firebase/firestore';
import { User } from '../../types';

interface StudentAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onStudentSelect: (student: User) => void;
  placeholder?: string;
  className?: string;
  year?: string;
  sem?: string;
  div?: string;
  department?: string;
}

const StudentAutocomplete: React.FC<StudentAutocompleteProps> = ({
  value,
  onChange,
  onStudentSelect,
  placeholder = "Type name or roll number...",
  className = "",
  year,
  sem,
  div,
  department
}) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.length >= 2) {
        searchStudents(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, year, sem, div, department]);

  const searchStudents = async (query: string) => {
    setLoading(true);
    try {
      // Search by name or roll number
      const students = await userService.searchStudents(query, {
        year,
        sem,
        div,
        department,
        limit: 10
      });
      setSuggestions(students);
      setShowSuggestions(students.length > 0);
    } catch (error) {
      console.error('Error searching students:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = (student: User) => {
    onChange(student.name);
    onStudentSelect(student);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={`w-full border rounded p-2 pr-8 ${className}`}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((student) => (
            <div
              key={student.id}
              onClick={() => handleSuggestionClick(student)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    Roll: {student.rollNumber || student.id}
                    {(student as any).year && (student as any).sem && (student as any).div && (
                      <span className="ml-2">
                        • {(student as any).year} Sem {(student as any).sem} Div {(student as any).div}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {student.department}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAutocomplete;


