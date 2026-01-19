// types/student.ts (MANDATORY FIX)

// --- Shared Nested Types ---

export interface StudentName {
    firstName: string;
    lastName: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
}

export interface StudentClass {
    className: string; // e.g., "1st Class"
    section: string; // e.g., "A"
    academicYear: string; // e.g., "2025-2026"
}

export interface Parent {
    name: string;
    phone: string;
    email: string;
    occupation: string;
}

export interface StudentParents {
    father: Parent;
    mother: Parent;
}

export interface StudentAddress {
    street: string;
    city: string;
    state: string;
    pincode: string;
}

// --- Main Student Interface (Expected from GET /students/:id) ---
export interface Student {
    firstName: any;
    lastName: any;
    section: string;
    phone: string;
    email: string;
    name: any;
    fullName: any;
    admissionNo: string;
    studentId: any;
    className: StudentClass;
    parentName: string;
    fatherName: any;
    parentPhone: string;
    contact: any;
    id: string;
    _id: string;
    admissionNumber: string;
    // The complex nested structure used in Students.tsx
    student: StudentName;
    class: StudentClass;
    parents: StudentParents;
    address: StudentAddress;
    
    // Additional fields expected by the component for the table
    attendance: number; 
    status: 'active' | 'inactive' | 'at-risk';
    feeStatus: 'paid' | 'pending' | 'overdue';
    transport: 'yes' | 'no' | 'N/A'; // N/A used in original table rendering, though 'yes'/'no' expected from backend
}

// --- Payload for POST /students (Create) ---
// Note: This is essentially the entire Student object without _id.
export interface StudentCreatePayload {
    admissionNumber: string;
    student: Omit<StudentName, 'dob'> & { dob: string }; // Date format assurance
    class: StudentClass;
    parents: StudentParents;
    address: StudentAddress;
    // Optional/Defaulted fields on creation
    status?: 'active' | 'inactive' | 'at-risk';
    attendance?: number; 
    feeStatus?: 'paid' | 'pending' | 'overdue';
    transport?: 'yes' | 'no' | 'N/A';
}